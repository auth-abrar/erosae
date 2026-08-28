import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding for Erosae.com...');

  // 1. SEED CURRENCIES & EXCHANGE RATES
  console.log('💰 Seeding 10 Currencies & Rates...');
  const currenciesData = [
    { code: 'USD', name: 'US Dollar', symbol: '$', symbolNative: '$', decimalDigits: 2, isBase: true, displayOrder: 1, rate: 1.0 },
    { code: 'AED', name: 'UAE Dirham', symbol: 'AED', symbolNative: 'د.إ', decimalDigits: 2, isBase: false, displayOrder: 2, rate: 3.6725 },
    { code: 'SAR', name: 'Saudi Riyal', symbol: 'SAR', symbolNative: 'ر.س', decimalDigits: 2, isBase: false, displayOrder: 3, rate: 3.7510 },
    { code: 'KWD', name: 'Kuwaiti Dinar', symbol: 'KD', symbolNative: 'د.ك', decimalDigits: 3, isBase: false, displayOrder: 4, rate: 0.3075 },
    { code: 'OMR', name: 'Omani Rial', symbol: 'OMR', symbolNative: 'ر.ع', decimalDigits: 3, isBase: false, displayOrder: 5, rate: 0.3845 },
    { code: 'BHD', name: 'Bahraini Dinar', symbol: 'BD', symbolNative: '.د.ب', decimalDigits: 3, isBase: false, displayOrder: 6, rate: 0.3770 },
    { code: 'QAR', name: 'Qatari Riyal', symbol: 'QAR', symbolNative: 'ر.ق', decimalDigits: 2, isBase: false, displayOrder: 7, rate: 3.6415 },
    { code: 'BDT', name: 'Bangladeshi Taka', symbol: 'BDT', symbolNative: '৳', decimalDigits: 2, isBase: false, displayOrder: 8, rate: 120.50 },
    { code: 'INR', name: 'Indian Rupee', symbol: 'INR', symbolNative: '₹', decimalDigits: 2, isBase: false, displayOrder: 9, rate: 86.80 },
    { code: 'PKR', name: 'Pakistani Rupee', symbol: 'PKR', symbolNative: '₨', decimalDigits: 2, isBase: false, displayOrder: 10, rate: 278.40 },
  ];

  for (const c of currenciesData) {
    await prisma.currency.upsert({
      where: { code: c.code },
      update: {
        name: c.name,
        symbol: c.symbol,
        symbolNative: c.symbolNative,
        decimalDigits: c.decimalDigits,
        isBase: c.isBase,
        displayOrder: c.displayOrder,
      },
      create: {
        code: c.code,
        name: c.name,
        symbol: c.symbol,
        symbolNative: c.symbolNative,
        decimalDigits: c.decimalDigits,
        isBase: c.isBase,
        displayOrder: c.displayOrder,
      },
    });

    const existingRate = await prisma.exchangeRate.findFirst({
      where: { currencyCode: c.code },
    });

    if (existingRate) {
      await prisma.exchangeRate.update({
        where: { id: existingRate.id },
        data: { rateToBase: c.rate },
      });
    } else {
      await prisma.exchangeRate.create({
        data: {
          currencyCode: c.code,
          rateToBase: c.rate,
          source: 'MANUAL',
        },
      });
    }
  }

  // 2. SEED PERMISSIONS & ROLES
  console.log('🛡️ Seeding Roles & Permissions...');
  const modules = ['CATALOG', 'ORDERS', 'CUSTOMERS', 'PAYMENTS', 'PROMOTIONS', 'SHIPPING_TAX', 'CUSTOM_FIELDS', 'STAFF', 'SETTINGS', 'REPORTS'];
  const actions = ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'EXPORT'];

  const createdPermissions = [];
  for (const mod of modules) {
    for (const act of actions) {
      const p = await prisma.permission.upsert({
        where: { module_action: { module: mod, action: act } },
        update: {},
        create: {
          module: mod,
          action: act,
          description: `${act} permission for ${mod} module`,
        },
      });
      createdPermissions.push(p);
    }
  }

  // Super Admin Role
  const superAdminRole = await prisma.role.upsert({
    where: { slug: 'super-admin' },
    update: {},
    create: {
      name: 'Super Administrator',
      slug: 'super-admin',
      description: 'Unrestricted access to all store modules and configurations',
      isSystem: true,
    },
  });

  // Assign all permissions to Super Admin
  for (const p of createdPermissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: superAdminRole.id, permissionId: p.id } },
      update: {},
      create: {
        roleId: superAdminRole.id,
        permissionId: p.id,
      },
    });
  }

  // Order Manager Role
  const orderManagerRole = await prisma.role.upsert({
    where: { slug: 'order-manager' },
    update: {},
    create: {
      name: 'Order Manager',
      slug: 'order-manager',
      description: 'Manage incoming orders, process shipments and customer inquiries',
      isSystem: false,
    },
  });

  // Assign order & customer permissions to Order Manager
  const orderManagerPerms = createdPermissions.filter(p => ['ORDERS', 'CUSTOMERS', 'REPORTS'].includes(p.module));
  for (const p of orderManagerPerms) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: orderManagerRole.id, permissionId: p.id } },
      update: {},
      create: {
        roleId: orderManagerRole.id,
        permissionId: p.id,
      },
    });
  }

  // 3. SEED DEFAULT ADMIN USER
  console.log('👤 Seeding Super Admin User...');
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('AdminPassword123!', salt);

  await prisma.adminUser.upsert({
    where: { email: 'admin@erosae.com' },
    update: {
      passwordHash,
      roleId: superAdminRole.id,
      name: 'Erosae Administrator',
    },
    create: {
      email: 'admin@erosae.com',
      passwordHash,
      name: 'Erosae Administrator',
      roleId: superAdminRole.id,
      isActive: true,
    },
  });

  // 4. SEED CATEGORIES
  console.log('📁 Seeding Category Hierarchy...');
  const categoriesTree = [
    {
      name: 'Electronics & Gadgets',
      slug: 'electronics-gadgets',
      description: 'Cutting-edge audio, smart wearables, and premium lifestyle tech.',
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
      children: [
        { name: 'Audio & Headphones', slug: 'audio-headphones', description: 'Wireless earbuds, noise-cancelling headphones and studio gear.' },
        { name: 'Smart Wearables', slug: 'smart-wearables', description: 'Smartwatches, fitness rings and high-tech tracking.' },
        { name: 'Home Tech & Lighting', slug: 'home-tech-lighting', description: 'Ambient smart lights and automated comfort.' },
      ],
    },
    {
      name: 'Fashion & Luxury',
      slug: 'fashion-luxury',
      description: 'Contemporary apparel, bespoke tailoring, and timeless accessories.',
      image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&auto=format&fit=crop&q=80',
      children: [
        { name: 'Men’s Collection', slug: 'mens-collection', description: 'Premium shirts, jackets, linen trousers, and footwear.' },
        { name: 'Women’s Collection', slug: 'womens-collection', description: 'Silk dresses, modest luxury, and contemporary sets.' },
        { name: 'Timepieces & Jewelry', slug: 'timepieces-jewelry', description: 'Automatic watches, minimalist bracelets and pendants.' },
      ],
    },
    {
      name: 'Beauty & Fragrances',
      slug: 'beauty-fragrances',
      description: 'Exquisite Arabian Oud, niche parfums, and clean botanical skincare.',
      image: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=800&auto=format&fit=crop&q=80',
      children: [
        { name: 'Oud & Niche Perfumes', slug: 'oud-niche-perfumes', description: 'Rich royal amber, pure Dehn Al Oud, and floral notes.' },
        { name: 'Botanical Skincare', slug: 'botanical-skincare', description: 'Hydrating serums, anti-aging creams and mineral masks.' },
      ],
    },
    {
      name: 'Home & Living',
      slug: 'home-living',
      description: 'Minimalist ceramics, artisanal rugs, and curated decor for modern spaces.',
      image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&auto=format&fit=crop&q=80',
      children: [
        { name: 'Artisan Ceramics', slug: 'artisan-ceramics', description: 'Handcrafted stoneware, matte vases and tableware.' },
        { name: 'Aroma Diffusers & Candles', slug: 'aroma-diffusers-candles', description: 'Soy wax scented candles and ultrasonic aroma diffusers.' },
      ],
    },
  ];

  const categoryMap = new Map<string, string>();

  for (const cat of categoriesTree) {
    const parent = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, description: cat.description, image: cat.image },
      create: { name: cat.name, slug: cat.slug, description: cat.description, image: cat.image },
    });
    categoryMap.set(cat.slug, parent.id);

    if (cat.children) {
      for (const child of cat.children) {
        const sub = await prisma.category.upsert({
          where: { slug: child.slug },
          update: { name: child.name, description: child.description, parentId: parent.id },
          create: { name: child.name, slug: child.slug, description: child.description, parentId: parent.id },
        });
        categoryMap.set(child.slug, sub.id);
      }
    }
  }

  // 5. SEED CUSTOM FIELD DEFINITIONS
  console.log('⚙️ Seeding Custom Fields Engine...');
  const warrantyField = await prisma.customFieldDefinition.upsert({
    where: { entityType_key: { entityType: 'PRODUCT', key: 'warranty_period' } },
    update: {},
    create: {
      entityType: 'PRODUCT',
      name: 'Warranty Coverage',
      key: 'warranty_period',
      fieldType: 'SELECT',
      options: JSON.stringify(['No Warranty', '6 Months International', '1 Year Official Warranty', '2 Years Extended']),
      isRequired: false,
      sortOrder: 1,
    },
  });

  const materialField = await prisma.customFieldDefinition.upsert({
    where: { entityType_key: { entityType: 'PRODUCT', key: 'material_composition' } },
    update: {},
    create: {
      entityType: 'PRODUCT',
      name: 'Material / Fabric Composition',
      key: 'material_composition',
      fieldType: 'TEXT',
      isRequired: false,
      sortOrder: 2,
    },
  });

  const originField = await prisma.customFieldDefinition.upsert({
    where: { entityType_key: { entityType: 'PRODUCT', key: 'country_of_origin' } },
    update: {},
    create: {
      entityType: 'PRODUCT',
      name: 'Country of Origin',
      key: 'country_of_origin',
      fieldType: 'TEXT',
      isRequired: false,
      sortOrder: 3,
    },
  });

  // 6. SEED SAMPLE PRODUCTS & VARIANTS
  console.log('📦 Seeding Products & Variants...');
  const sampleProducts = [
    {
      title: 'Aura Pro ANC Wireless Headphones',
      slug: 'aura-pro-anc-wireless-headphones',
      description: 'Engineered for audiophiles. Features 45mm custom dynamic neodymium drivers, active hybrid noise cancellation up to 42dB, transparency mode, and 50-hour ultra battery life with quick charge.',
      shortDescription: 'High-Fidelity Hybrid ANC with 50-hour battery life.',
      basePriceUSD: 199.00,
      compareAtPriceUSD: 249.00,
      costPriceUSD: 95.00,
      sku: 'ERO-TECH-001',
      categorySlug: 'audio-headphones',
      brand: 'Erosae Acoustic',
      isFeatured: true,
      ratingAvg: 4.9,
      ratingCount: 142,
      images: [
        { url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1000&auto=format&fit=crop&q=80', isPrimary: true },
        { url: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=1000&auto=format&fit=crop&q=80', isPrimary: false },
      ],
      variants: [
        { sku: 'ERO-TECH-001-BLK', title: 'Matte Obsidian', priceOffsetUSD: 0, stockQuantity: 65, attributes: { Color: 'Matte Obsidian' } },
        { sku: 'ERO-TECH-001-SLV', title: 'Lunar Silver', priceOffsetUSD: 10, stockQuantity: 40, attributes: { Color: 'Lunar Silver' } },
        { sku: 'ERO-TECH-001-GLD', title: 'Desert Gold', priceOffsetUSD: 20, stockQuantity: 18, attributes: { Color: 'Desert Gold' } },
      ],
      customFields: [
        { defId: warrantyField.id, text: '2 Years Extended' },
        { defId: originField.id, text: 'Designed in Dubai, Assembled in Japan' },
      ],
    },
    {
      title: 'Royal Dehn Al Oud Extrait de Parfum',
      slug: 'royal-dehn-al-oud-extrait-de-parfum',
      description: 'A regal masterpiece crafted from aged wild Agarwood from the forests of Assam, blended with pure Taif Rose, rich amber resin, and warm spicy vanilla. 35% pure fragrance oil concentration with immense sillage.',
      shortDescription: '35% Oil Extrait with pure aged Agarwood & Taif Rose.',
      basePriceUSD: 165.00,
      compareAtPriceUSD: 210.00,
      costPriceUSD: 60.00,
      sku: 'ERO-OUD-001',
      categorySlug: 'oud-niche-perfumes',
      brand: 'Erosae Parfums Privé',
      isFeatured: true,
      ratingAvg: 5.0,
      ratingCount: 88,
      images: [
        { url: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=1000&auto=format&fit=crop&q=80', isPrimary: true },
        { url: 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?w=1000&auto=format&fit=crop&q=80', isPrimary: false },
      ],
      variants: [
        { sku: 'ERO-OUD-001-50ML', title: '50ml Crystal Bottle', priceOffsetUSD: 0, stockQuantity: 50, attributes: { Size: '50ml' } },
        { sku: 'ERO-OUD-001-100ML', title: '100ml Luxury Decanter', priceOffsetUSD: 85, stockQuantity: 25, attributes: { Size: '100ml' } },
      ],
      customFields: [
        { defId: originField.id, text: 'Grasse, France & Dubai, UAE' },
      ],
    },
    {
      title: 'Chronograph Minimalist Automatic Watch',
      slug: 'chronograph-minimalist-automatic-watch',
      description: 'Featuring a Japanese Miyota 9015 mechanical movement with 42-hour power reserve, 316L surgical stainless steel case, anti-reflective sapphire crystal glass, and interchangeable Italian top-grain leather strap.',
      shortDescription: 'Japanese Miyota 9015 Automatic with Sapphire Crystal.',
      basePriceUSD: 280.00,
      compareAtPriceUSD: 350.00,
      costPriceUSD: 110.00,
      sku: 'ERO-TIME-001',
      categorySlug: 'timepieces-jewelry',
      brand: 'Erosae Horology',
      isFeatured: true,
      ratingAvg: 4.8,
      ratingCount: 56,
      images: [
        { url: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=1000&auto=format&fit=crop&q=80', isPrimary: true },
        { url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=1000&auto=format&fit=crop&q=80', isPrimary: false },
      ],
      variants: [
        { sku: 'ERO-TIME-001-BRN', title: '40mm Silver / Cognac Leather', priceOffsetUSD: 0, stockQuantity: 30, attributes: { Case: 'Silver 40mm', Strap: 'Cognac Leather' } },
        { sku: 'ERO-TIME-001-BLK', title: '40mm Black / Midnight Leather', priceOffsetUSD: 15, stockQuantity: 22, attributes: { Case: 'Black 40mm', Strap: 'Midnight Leather' } },
      ],
      customFields: [
        { defId: warrantyField.id, text: '2 Years Extended' },
        { defId: materialField.id, text: '316L Stainless Steel & Italian Calfskin' },
      ],
    },
    {
      title: 'Artisan Matte Sand Ceramic Vase Set',
      slug: 'artisan-matte-sand-ceramic-vase-set',
      description: 'Handcrafted trio of textured earthenware vases in organic geometric silhouettes. Neutral sandy beige finish with subtle speckled minerals, ideal for dried botanicals and minimalist living spaces.',
      shortDescription: 'Set of 3 handcrafted stoneware geometric vases.',
      basePriceUSD: 79.00,
      compareAtPriceUSD: 105.00,
      costPriceUSD: 28.00,
      sku: 'ERO-HOME-001',
      categorySlug: 'artisan-ceramics',
      brand: 'Erosae Maison',
      isFeatured: false,
      ratingAvg: 4.7,
      ratingCount: 34,
      images: [
        { url: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1000&auto=format&fit=crop&q=80', isPrimary: true },
        { url: 'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?w=1000&auto=format&fit=crop&q=80', isPrimary: false },
      ],
      variants: [
        { sku: 'ERO-HOME-001-TRIO', title: 'Trio Set (Small, Medium, Tall)', priceOffsetUSD: 0, stockQuantity: 45, attributes: { Set: 'Trio Set' } },
      ],
      customFields: [
        { defId: materialField.id, text: '100% Hand-thrown Natural Stoneware' },
        { defId: originField.id, text: 'Artisanal Studio, Portugal' },
      ],
    },
    {
      title: 'Ultrasonic Stone Essential Oil Diffuser',
      slug: 'ultrasonic-stone-essential-oil-diffuser',
      description: 'Milled from a solid piece of natural ceramic porcelain with soft ambient warm LED lighting. Whisper-quiet ultrasonic vibrations diffuse pure essential oils up to 500 sq ft for up to 8 continuous hours.',
      shortDescription: 'Porcelain stone ultrasonic diffuser with ambient glow.',
      basePriceUSD: 65.00,
      compareAtPriceUSD: 85.00,
      costPriceUSD: 24.00,
      sku: 'ERO-HOME-002',
      categorySlug: 'aroma-diffusers-candles',
      brand: 'Erosae Maison',
      isFeatured: true,
      ratingAvg: 4.9,
      ratingCount: 93,
      images: [
        { url: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=1000&auto=format&fit=crop&q=80', isPrimary: true },
      ],
      variants: [
        { sku: 'ERO-DIFF-WHT', title: 'Chalk White', priceOffsetUSD: 0, stockQuantity: 60, attributes: { Color: 'Chalk White' } },
        { sku: 'ERO-DIFF-BLK', title: 'Basalt Charcoal', priceOffsetUSD: 5, stockQuantity: 35, attributes: { Color: 'Basalt Charcoal' } },
        { sku: 'ERO-DIFF-TER', title: 'Terracotta Clay', priceOffsetUSD: 5, stockQuantity: 15, attributes: { Color: 'Terracotta Clay' } },
      ],
      customFields: [
        { defId: warrantyField.id, text: '1 Year Official Warranty' },
      ],
    },
  ];

  for (const p of sampleProducts) {
    const categoryId = categoryMap.get(p.categorySlug) || Array.from(categoryMap.values())[0];
    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      update: {
        title: p.title,
        description: p.description,
        shortDescription: p.shortDescription,
        basePriceUSD: p.basePriceUSD,
        compareAtPriceUSD: p.compareAtPriceUSD,
        costPriceUSD: p.costPriceUSD,
        sku: p.sku,
        brand: p.brand,
        categoryId,
        isFeatured: p.isFeatured,
        ratingAvg: p.ratingAvg,
        ratingCount: p.ratingCount,
      },
      create: {
        title: p.title,
        slug: p.slug,
        description: p.description,
        shortDescription: p.shortDescription,
        basePriceUSD: p.basePriceUSD,
        compareAtPriceUSD: p.compareAtPriceUSD,
        costPriceUSD: p.costPriceUSD,
        sku: p.sku,
        brand: p.brand,
        categoryId,
        isFeatured: p.isFeatured,
        ratingAvg: p.ratingAvg,
        ratingCount: p.ratingCount,
      },
    });

    // Images
    for (let i = 0; i < p.images.length; i++) {
      const img = p.images[i];
      const existingImg = await prisma.productImage.findFirst({
        where: { productId: product.id, url: img.url },
      });
      if (!existingImg) {
        await prisma.productImage.create({
          data: {
            productId: product.id,
            url: img.url,
            isPrimary: img.isPrimary,
            sortOrder: i,
          },
        });
      }
    }

    // Variants
    for (const v of p.variants) {
      await prisma.productVariant.upsert({
        where: { sku: v.sku },
        update: {
          title: v.title,
          priceOffsetUSD: v.priceOffsetUSD,
          stockQuantity: v.stockQuantity,
          attributes: JSON.stringify(v.attributes),
        },
        create: {
          productId: product.id,
          sku: v.sku,
          title: v.title,
          priceOffsetUSD: v.priceOffsetUSD,
          stockQuantity: v.stockQuantity,
          attributes: JSON.stringify(v.attributes),
        },
      });
    }

    // Custom Fields
    if (p.customFields) {
      for (const cf of p.customFields) {
        const existingVal = await prisma.customFieldValue.findFirst({
          where: { definitionId: cf.defId, entityId: product.id },
        });
        if (!existingVal) {
          await prisma.customFieldValue.create({
            data: {
              definitionId: cf.defId,
              entityId: product.id,
              valueText: cf.text,
            },
          });
        }
      }
    }
  }

  // 7. SEED PAYMENT GATEWAYS
  console.log('💳 Seeding Payment Gateways...');
  const gateways = [
    {
      name: 'Stripe (Credit / Debit Cards, Apple Pay, Google Pay)',
      slug: 'stripe',
      driver: 'STRIPE',
      isEnabled: true,
      isTestMode: true,
      supportedCurrencies: JSON.stringify(['USD', 'AED', 'SAR', 'KWD', 'OMR', 'BHD', 'BDT', 'INR', 'PKR', 'QAR']),
      supportedCountries: JSON.stringify(['*']),
      encryptedConfig: JSON.stringify({
        publishableKey: 'pk_test_sample_erosae_key',
        secretKey: 'sk_test_sample_erosae_secret',
        webhookSecret: 'whsec_sample_erosae_webhook',
      }),
      displayOrder: 1,
    },
    {
      name: 'Cash on Delivery (COD)',
      slug: 'cod',
      driver: 'COD',
      isEnabled: true,
      isTestMode: false,
      supportedCurrencies: JSON.stringify(['AED', 'SAR', 'KWD', 'OMR', 'BHD', 'QAR', 'BDT', 'INR', 'PKR']),
      supportedCountries: JSON.stringify(['AE', 'SA', 'KW', 'OM', 'BH', 'QA', 'BD', 'IN', 'PK']),
      encryptedConfig: JSON.stringify({
        extraFeeUSD: 0,
        instructions: 'Pay conveniently in cash or local card on delivery to our courier agent upon receiving your shipment package.',
      }),
      displayOrder: 2,
    },
    {
      name: 'Direct Bank Wire / Fast Deposit',
      slug: 'bank-transfer',
      driver: 'BANK_TRANSFER',
      isEnabled: true,
      isTestMode: false,
      supportedCurrencies: JSON.stringify(['USD', 'AED', 'SAR', 'KWD', 'BDT']),
      supportedCountries: JSON.stringify(['*']),
      encryptedConfig: JSON.stringify({
        accountName: 'Erosae Commercial Enterprises LLC',
        bankName: 'Emirates NBD / HSBC Global',
        accountNumber: '102938475601',
        iban: 'AE07026000102938475601',
        swift: 'EBILAEADXXX',
        instructions: 'Please include your Order Number as payment reference. Orders are dispatched once payment confirmation is received.',
      }),
      displayOrder: 3,
    },
  ];

  for (const g of gateways) {
    await prisma.paymentGateway.upsert({
      where: { slug: g.slug },
      update: {
        name: g.name,
        driver: g.driver,
        isEnabled: g.isEnabled,
        isTestMode: g.isTestMode,
        supportedCurrencies: g.supportedCurrencies,
        supportedCountries: g.supportedCountries,
        encryptedConfig: g.encryptedConfig,
        displayOrder: g.displayOrder,
      },
      create: g,
    });
  }

  // 8. SEED SHIPPING RULES
  console.log('🚚 Seeding Shipping Rules...');
  const shippingRules = [
    { name: 'GCC Express Courier (UAE, KSA, Kuwait, Oman, Bahrain, Qatar)', countryCode: 'GCC', baseFeeUSD: 8.00, freeShippingThresholdUSD: 75.00, estimatedDaysMin: 2, estimatedDaysMax: 4 },
    { name: 'South Asia Express (Bangladesh, India, Pakistan)', countryCode: 'SOUTH_ASIA', baseFeeUSD: 6.00, freeShippingThresholdUSD: 50.00, estimatedDaysMin: 3, estimatedDaysMax: 5 },
    { name: 'Global International Air Cargo', countryCode: 'ALL', baseFeeUSD: 18.00, freeShippingThresholdUSD: 150.00, estimatedDaysMin: 5, estimatedDaysMax: 10 },
  ];

  for (const s of shippingRules) {
    const existing = await prisma.shippingRule.findFirst({ where: { name: s.name } });
    if (!existing) {
      await prisma.shippingRule.create({ data: s });
    }
  }

  // 9. SEED COUPONS
  console.log('🎟️ Seeding Promo Coupons...');
  await prisma.coupon.upsert({
    where: { code: 'WELCOME10' },
    update: {},
    create: {
      code: 'WELCOME10',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      minOrderAmountUSD: 40,
      isActive: true,
    },
  });

  await prisma.coupon.upsert({
    where: { code: 'ERO25' },
    update: {},
    create: {
      code: 'ERO25',
      discountType: 'FIXED_USD',
      discountValue: 25,
      minOrderAmountUSD: 150,
      isActive: true,
    },
  });

  // 10. SEED STORE SETTINGS
  console.log('🎨 Seeding Storefront Settings & Branding...');
  const settings = [
    { key: 'site_name', value: 'Erosae', group: 'BRANDING' },
    { key: 'site_tagline', value: 'Curated Global Living & Modern Luxury', group: 'BRANDING' },
    { key: 'announcement_text', value: '✨ Complimentary GCC & South Asia Express Delivery on Orders Over $75 USD | 10 Regional Currencies Supported', group: 'BRANDING' },
    { key: 'contact_email', value: 'concierge@erosae.com', group: 'GENERAL' },
    { key: 'contact_phone', value: '+971 4 800 EROSAE', group: 'GENERAL' },
  ];

  for (const st of settings) {
    await prisma.storeSetting.upsert({
      where: { key: st.key },
      update: { value: st.value, group: st.group },
      create: st,
    });
  }

  console.log('✅ Database Seeding Completed Successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });