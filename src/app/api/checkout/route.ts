import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { PaymentEngine } from '@/lib/payment-engine';
import { getUserSession } from '@/lib/auth';
import { Money } from '@/lib/money';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      cart,
      shippingAddress,
      paymentMethod = 'COD',
      currencyCode = 'BDT',
      customerNotes,
      couponCode,
      acceptedPolicyVersions,
    } = body;

    // 1. Validate Cart & Recipient Data
    if (!cart || !Array.isArray(cart) || cart.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Your shopping cart is empty.' },
        { status: 400 }
      );
    }

    if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.addressLine1 || !shippingAddress.phone) {
      return NextResponse.json(
        { success: false, message: 'Please provide full recipient name, address, and mobile number.' },
        { status: 400 }
      );
    }

    // Check if user is logged in
    const userSession = await getUserSession();
    const authenticatedUserId = userSession ? userSession.userId : null;

    // 2. Fetch Dynamic Store & Checkout Settings
    const settings = await prisma.siteSetting.findMany({
      where: {
        key: {
          in: [
            'checkout.insideDhakaRateBDT',
            'checkout.outsideDhakaRateBDT',
            'checkout.freeShippingThresholdBDT',
            'orders.prefix',
          ],
        },
      },
    });

    const settingsMap: Record<string, any> = {};
    for (const s of settings) {
      try {
        settingsMap[s.key] = JSON.parse(s.value);
      } catch {
        settingsMap[s.key] = s.value;
      }
    }

    const insideDhakaRate = typeof settingsMap['checkout.insideDhakaRateBDT'] === 'number' ? settingsMap['checkout.insideDhakaRateBDT'] : 70.0;
    const outsideDhakaRate = typeof settingsMap['checkout.outsideDhakaRateBDT'] === 'number' ? settingsMap['checkout.outsideDhakaRateBDT'] : 130.0;
    const freeShippingThreshold = typeof settingsMap['checkout.freeShippingThresholdBDT'] === 'number' ? settingsMap['checkout.freeShippingThresholdBDT'] : 3000.0;
    const orderPrefix = settingsMap['orders.prefix'] || 'ERO';

    // 3. Authoritative Server-Side Calculation & Stock Verification
    let subtotalBDT = 0;
    const validatedItems: any[] = [];

    for (const item of cart) {
      const quantity = Math.max(1, parseInt(item.quantity) || 1);

      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        include: { variants: true },
      });

      if (!product || !product.isPublished) {
        return NextResponse.json(
          { success: false, message: `Product is unavailable: ${item.titleEn || item.productId}` },
          { status: 400 }
        );
      }

      let unitPriceBDT = product.basePriceBDT;
      let costPriceBDT = product.costPriceBDT || Money.multiply(product.basePriceBDT, 0.7);
      let variantToDeduct = product.variants[0] || null;

      if (item.variantId) {
        const variant = product.variants.find((v) => v.id === item.variantId);
        if (variant) {
          unitPriceBDT = variant.priceBDT;
          if (variant.costPriceBDT) costPriceBDT = variant.costPriceBDT;
          variantToDeduct = variant;
        }
      }

      // Check stock availability
      if (variantToDeduct && variantToDeduct.stockQuantity < quantity && !product.isBackorderAllowed) {
        return NextResponse.json(
          {
            success: false,
            message: `Insufficient stock for '${product.titleEn}'. Available: ${variantToDeduct.stockQuantity}, Requested: ${quantity}.`,
          },
          { status: 409 }
        );
      }

      const itemTotalBDT = Money.multiply(unitPriceBDT, quantity);
      subtotalBDT = Money.add(subtotalBDT, itemTotalBDT);

      validatedItems.push({
        productId: product.id,
        variantId: variantToDeduct ? variantToDeduct.id : null,
        titleEn: product.titleEn,
        titleBn: product.titleBn,
        sku: variantToDeduct ? variantToDeduct.sku : product.sku,
        productType: product.type,
        unitPriceBDT,
        costPriceBDT,
        quantity,
        totalPriceBDT: itemTotalBDT,
      });
    }

    // 4. Dynamic Shipping Zone Calculation
    const isInsideDhaka =
      shippingAddress.city?.toLowerCase().includes('dhaka') ||
      shippingAddress.addressLine1?.toLowerCase().includes('dhaka');

    let shippingBDT = isInsideDhaka ? insideDhakaRate : outsideDhakaRate;
    if (subtotalBDT >= freeShippingThreshold) {
      shippingBDT = 0.0; // Free shipping threshold met
    }

    // 5. Coupon Validation & Discount
    let discountBDT = 0;
    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: couponCode.toUpperCase() },
      });
      if (coupon && coupon.isActive) {
        if (!coupon.minSpendBDT || subtotalBDT >= coupon.minSpendBDT) {
          if (coupon.discountType === 'PERCENTAGE') {
            discountBDT = Money.multiply(subtotalBDT, coupon.discountValue / 100);
            if (coupon.maxDiscountBDT && discountBDT > coupon.maxDiscountBDT) {
              discountBDT = coupon.maxDiscountBDT;
            }
          } else if (coupon.discountType === 'FIXED') {
            discountBDT = coupon.discountValue;
          } else if (coupon.discountType === 'FREE_SHIPPING') {
            shippingBDT = 0;
          }
        }
      }
    }

    const { totalBDT } = Money.calculateOrderTotals({
      items: validatedItems.map((i) => ({ unitPriceBDT: i.unitPriceBDT, quantity: i.quantity })),
      shippingFeeBDT: shippingBDT,
      discountBDT,
    });

    const orderNumber = `${orderPrefix}-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

    // 6. Complete Atomic Transaction: Order, Inventory Decrement, Accounting Journal & CRM Profile Update
    const newOrder = await prisma.$transaction(async (tx) => {
      // a. Atomically decrement variant stock
      for (const item of validatedItems) {
        if (item.variantId) {
          const currentVariant = await tx.productVariant.findUnique({
            where: { id: item.variantId },
          });

          if (!currentVariant || currentVariant.stockQuantity < item.quantity) {
            throw new Error(`Stock error: ${item.titleEn} ran out of stock during checkout.`);
          }

          await tx.productVariant.update({
            where: { id: item.variantId },
            data: {
              stockQuantity: {
                decrement: item.quantity,
              },
            },
          });
        }
      }

      // b. Create Order Record
      const order = await tx.order.create({
        data: {
          orderNumber,
          userId: authenticatedUserId,
          guestEmail: shippingAddress.email || null,
          guestPhone: shippingAddress.phone,
          guestName: shippingAddress.fullName,
          status: 'PENDING',
          paymentStatus: 'PENDING',
          fulfillmentStatus: 'UNFULFILLED',
          paymentMethod: paymentMethod.toUpperCase(),
          currencyCode,
          exchangeRateToBDT: 1.0,
          subtotalAmountBDT: subtotalBDT,
          taxAmountBDT: 0.0,
          shippingAmountBDT: shippingBDT,
          discountAmountBDT: discountBDT,
          totalAmountBDT: totalBDT,
          shippingAddressJson: JSON.stringify(shippingAddress),
          policyConsentSnapshot: acceptedPolicyVersions ? JSON.stringify(acceptedPolicyVersions) : 'TERMS_V1,PRIVACY_V1',
          customerNotes: customerNotes || null,
          items: {
            create: validatedItems,
          },
        },
        include: {
          items: true,
        },
      });

      // c. Add Initial Timeline Entry
      await tx.orderTimeline.create({
        data: {
          orderId: order.id,
          status: 'PENDING',
          title: 'Order Placed',
          description: `Order #${orderNumber} placed via ${paymentMethod}. Total: ৳${totalBDT}`,
          actorType: authenticatedUserId ? 'CUSTOMER' : 'GUEST',
          actorId: authenticatedUserId,
        },
      });

      // d. Automatic Double-Entry General Ledger Recognition
      // Lookup or fallback to standard Accounts
      const arAccount = await tx.account.findFirst({ where: { code: '1100' } }); // Accounts Receivable
      const revenueAccount = await tx.account.findFirst({ where: { code: '4000' } }); // Sales Revenue

      if (arAccount && revenueAccount) {
        await tx.journalEntry.create({
          data: {
            entryNumber: `JE-ORD-${order.id.slice(-8)}`,
            description: `Revenue recognition for Order #${orderNumber}`,
            referenceType: 'ORDER',
            referenceId: order.id,
            orderId: order.id,
            lines: {
              create: [
                {
                  accountId: arAccount.id,
                  debitBDT: totalBDT,
                  creditBDT: 0,
                  memo: `AR for Order #${orderNumber}`,
                },
                {
                  accountId: revenueAccount.id,
                  debitBDT: 0,
                  creditBDT: totalBDT,
                  memo: `Sales Revenue for Order #${orderNumber}`,
                },
              ],
            },
          },
        });

        // Update account balances
        await tx.account.update({
          where: { id: arAccount.id },
          data: { balanceBDT: { increment: totalBDT } },
        });
        await tx.account.update({
          where: { id: revenueAccount.id },
          data: { balanceBDT: { increment: totalBDT } },
        });
      }

      // e. Update CRM Customer Intelligence Profile if authenticated
      if (authenticatedUserId) {
        await tx.customerProfile.upsert({
          where: { userId: authenticatedUserId },
          update: {
            totalOrdersCount: { increment: 1 },
            totalSpentBDT: { increment: totalBDT },
            lastOrderDate: new Date(),
          },
          create: {
            userId: authenticatedUserId,
            totalOrdersCount: 1,
            totalSpentBDT: totalBDT,
            lastOrderDate: new Date(),
          },
        });
      }

      return order;
    });

    // 7. Initiate Payment (MOCK / DEMO Provider Pipeline)
    const paymentResult = await PaymentEngine.initiatePayment(paymentMethod, {
      orderId: newOrder.id,
      orderNumber: newOrder.orderNumber,
      amountBDT: totalBDT,
      currency: currencyCode,
      customerEmail: shippingAddress.email || '',
      customerName: shippingAddress.fullName,
      customerPhone: shippingAddress.phone,
      returnUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/checkout/success?orderId=${newOrder.id}`,
      cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/checkout?status=cancelled`,
    });

    return NextResponse.json({
      success: true,
      order: newOrder,
      payment: paymentResult,
      redirectUrl: paymentResult.redirectUrl || `/checkout/success?orderId=${newOrder.id}`,
    });
  } catch (error: any) {
    console.error('Checkout API Error:', error);
    return NextResponse.json({ success: false, message: error.message || 'Checkout failed.' }, { status: 500 });
  }
}
