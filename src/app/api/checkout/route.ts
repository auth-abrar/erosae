import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSession } from '@/lib/auth';
import { convertFromUSD } from '@/lib/currency';
import { getGatewayConfigBySlug, getPaymentDriver } from '@/lib/payment-drivers';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    const body = await req.json();

    const {
      items,
      customerEmail,
      customerName,
      customerPhone,
      shippingAddress,
      billingAddress,
      paymentMethod,
      currencyCode = 'USD',
      couponCode,
    } = body;

    if (!items || !items.length) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    if (!customerEmail || !customerName) {
      return NextResponse.json({ error: 'Customer details are required' }, { status: 400 });
    }

    // Get live exchange rate
    const rateRecord = await prisma.exchangeRate.findFirst({
      where: { currencyCode },
    });
    const exchangeRate = rateRecord?.rateToBase || 1.0;

    // Verify products and calculate subtotal in USD
    let subtotalUSD = 0;
    const verifiedItems = [];

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        include: { variants: true },
      });

      if (!product || !product.isActive || product.deletedAt) {
        return NextResponse.json(
          { error: `Product "${item.title}" is no longer available.` },
          { status: 400 }
        );
      }

      let unitPriceUSD = product.basePriceUSD;
      let variantTitle = undefined;
      let sku = product.sku;

      if (item.variantId) {
        const variant = product.variants.find((v) => v.id === item.variantId);
        if (variant) {
          unitPriceUSD += variant.priceOffsetUSD;
          variantTitle = variant.title;
          sku = variant.sku;
        }
      }

      const itemTotalUSD = unitPriceUSD * item.quantity;
      subtotalUSD += itemTotalUSD;

      const unitPriceInCurrency = convertFromUSD(unitPriceUSD, currencyCode, { [currencyCode]: exchangeRate });
      const totalPriceInCurrency = convertFromUSD(itemTotalUSD, currencyCode, { [currencyCode]: exchangeRate });

      verifiedItems.push({
        productId: product.id,
        variantId: item.variantId || null,
        title: product.title,
        variantTitle,
        sku,
        unitPriceUSD,
        unitPrice: unitPriceInCurrency,
        quantity: item.quantity,
        totalPrice: totalPriceInCurrency,
      });
    }

    // Calculate discount
    let discountUSD = 0;
    if (couponCode === 'WELCOME10') {
      discountUSD = (subtotalUSD * 10) / 100;
    } else if (couponCode === 'ERO25' && subtotalUSD >= 150) {
      discountUSD = 25;
    }

    // Shipping calculation (free over $75 USD equivalent)
    const shippingAmountUSD = subtotalUSD >= 75 ? 0 : 8.0;
    const shippingAmount = convertFromUSD(shippingAmountUSD, currencyCode, { [currencyCode]: exchangeRate });
    const discountAmount = convertFromUSD(discountUSD, currencyCode, { [currencyCode]: exchangeRate });
    const subtotalAmount = convertFromUSD(subtotalUSD, currencyCode, { [currencyCode]: exchangeRate });
    const totalAmountUSD = Math.max(0, subtotalUSD - discountUSD + shippingAmountUSD);
    const totalAmount = convertFromUSD(totalAmountUSD, currencyCode, { [currencyCode]: exchangeRate });

    // Generate Order Number
    const orderNumber = `ERO-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

    // Create Order in DB
    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: session?.userId || null,
        guestEmail: customerEmail,
        guestName: customerName,
        guestPhone: customerPhone || null,
        orderStatus: 'PENDING',
        paymentStatus: 'UNPAID',
        fulfillmentStatus: 'UNFULFILLED',
        currencyCode,
        exchangeRateUsed: exchangeRate,
        subtotalAmount,
        shippingAmount,
        discountAmount,
        totalAmount,
        totalAmountUSD,
        shippingAddress: JSON.stringify(shippingAddress),
        billingAddress: JSON.stringify(billingAddress || shippingAddress),
        paymentMethod: paymentMethod || 'COD',
        couponCode: couponCode || null,
        items: {
          create: verifiedItems,
        },
      },
    });

    // Initiate payment with chosen driver
    const gatewayConfig = await getGatewayConfigBySlug(paymentMethod || 'cod');
    const driverType = gatewayConfig?.driver || 'COD';
    const driver = getPaymentDriver(driverType);

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

    const initiationResult = await driver.initiatePayment(
      {
        orderId: order.id,
        orderNumber: order.orderNumber,
        amount: totalAmount,
        currencyCode,
        customerEmail,
        customerName,
        customerPhone,
        shippingAddress,
        items: verifiedItems.map((it) => ({
          title: it.variantTitle ? `${it.title} (${it.variantTitle})` : it.title,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
        })),
        successUrl: `${baseUrl}/order-confirmation/${order.orderNumber}`,
        cancelUrl: `${baseUrl}/checkout`,
      },
      gatewayConfig || {
        id: 'cod',
        name: 'Cash on Delivery',
        slug: 'cod',
        driver: 'COD',
        isEnabled: true,
        isTestMode: false,
        supportedCurrencies: ['*'],
        supportedCountries: ['*'],
        credentials: {},
      }
    );

    // Save payment log
    await prisma.payment.create({
      data: {
        orderId: order.id,
        gatewayId: gatewayConfig?.id || null,
        gatewayTransactionId: initiationResult.gatewayTransactionId || null,
        amount: totalAmount,
        currencyCode,
        status: initiationResult.status === 'SUCCESS' ? 'SUCCESS' : 'PENDING',
        rawResponse: JSON.stringify(initiationResult),
      },
    });

    return NextResponse.json({
      success: true,
      orderNumber: order.orderNumber,
      orderId: order.id,
      initiationResult,
      totalAmount,
      currencyCode,
    });
  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: error.message || 'Checkout failed' }, { status: 500 });
  }
}