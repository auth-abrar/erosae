const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Seeding Erosae.com Master Production Database...');

  // ==========================================
  // 1. CURRENCIES (BDT is Base / Default)
  // ==========================================
  const currencies = [
    { code: 'BDT', nameEn: 'Bangladeshi Taka', nameBn: 'বাংলাদেশী টাকা', symbol: '৳', symbolPosition: 'BEFORE', decimalPlaces: 2, exchangeRateToBDT: 1.0, isDefault: true, isActive: true },
    { code: 'USD', nameEn: 'US Dollar', nameBn: 'ইউএস ডলার', symbol: '$', symbolPosition: 'BEFORE', decimalPlaces: 2, exchangeRateToBDT: 120.0, isDefault: false, isActive: true },
    { code: 'EUR', nameEn: 'Euro', nameBn: 'ইউরো', symbol: '€', symbolPosition: 'BEFORE', decimalPlaces: 2, exchangeRateToBDT: 130.5, isDefault: false, isActive: true },
    { code: 'GBP', nameEn: 'British Pound', nameBn: 'ব্রিটিশ পাউন্ড', symbol: '£', symbolPosition: 'BEFORE', decimalPlaces: 2, exchangeRateToBDT: 154.0, isDefault: false, isActive: true },
    { code: 'AED', nameEn: 'UAE Dirham', nameBn: 'সংযুক্ত আরব আমিরাত দিরহাম', symbol: 'د.إ', symbolPosition: 'AFTER', decimalPlaces: 2, exchangeRateToBDT: 32.7, isDefault: false, isActive: true },
    { code: 'SAR', nameEn: 'Saudi Riyal', nameBn: 'সৌদি রিয়াল', symbol: '﷼', symbolPosition: 'AFTER', decimalPlaces: 2, exchangeRateToBDT: 32.0, isDefault: false, isActive: true },
    { code: 'QAR', nameEn: 'Qatari Riyal', nameBn: 'কাতারি রিয়াল', symbol: '﷼', symbolPosition: 'AFTER', decimalPlaces: 2, exchangeRateToBDT: 33.0, isDefault: false, isActive: true },
    { code: 'KWD', nameEn: 'Kuwaiti Dinar', nameBn: 'কুয়েতি দিনার', symbol: 'د.ك', symbolPosition: 'AFTER', decimalPlaces: 3, exchangeRateToBDT: 392.0, isDefault: false, isActive: true },
    { code: 'INR', nameEn: 'Indian Rupee', nameBn: 'ভারতীয় রুপি', symbol: '₹', symbolPosition: 'BEFORE', decimalPlaces: 2, exchangeRateToBDT: 1.43, isDefault: false, isActive: true },
  ];

  for (const curr of currencies) {
    await prisma.currency.upsert({
      where: { code: curr.code },
      update: curr,
      create: curr,
    });
  }
  console.log('✅ Currencies seeded with BDT as default base.');

  // ==========================================
  // 2. ROLES, PERMISSIONS & ADMIN USERS
  // ==========================================
  const permissionsList = [
    { code: 'catalog.view', name: 'View Catalog', module: 'catalog' },
    { code: 'catalog.create', name: 'Create Products & Categories', module: 'catalog' },
    { code: 'catalog.edit', name: 'Edit Products & Pricing', module: 'catalog' },
    { code: 'catalog.delete', name: 'Delete Catalog Items', module: 'catalog' },
    { code: 'orders.view', name: 'View Orders', module: 'orders' },
    { code: 'orders.process', name: 'Process & Ship Orders', module: 'orders' },
    { code: 'orders.cancel', name: 'Cancel Orders', module: 'orders' },
    { code: 'orders.refund', name: 'Authorize Refunds', module: 'orders' },
    { code: 'inventory.view', name: 'View Stock & Warehouses', module: 'inventory' },
    { code: 'inventory.adjust', name: 'Make Stock Adjustments', module: 'inventory' },
    { code: 'finance.view', name: 'View Accounting & Reports', module: 'finance' },
    { code: 'crm.manage', name: 'Manage Customers & Support', module: 'crm' },
    { code: 'settings.manage', name: 'Manage Store Configuration', module: 'settings' },
  ];

  for (const p of permissionsList) {
    await prisma.permission.upsert({
      where: { code: p.code },
      update: p,
      create: p,
    });
  }

  const superAdminRole = await prisma.role.upsert({
    where: { name: 'Super Admin' },
    update: {},
    create: {
      name: 'Super Admin',
      description: 'Master owner role with unlimited access to every subsystem and ledger',
      isSystem: true,
    },
  });

  const allPerms = await prisma.permission.findMany();
  for (const perm of allPerms) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: superAdminRole.id,
          permissionId: perm.id,
        },
      },
      update: {},
      create: {
        roleId: superAdminRole.id,
        permissionId: perm.id,
      },
    });
  }

  const adminPasswordHash = await bcrypt.hash('Admin@Erosae2026!', 12);
  await prisma.adminUser.upsert({
    where: { email: 'admin@erosae.com' },
    update: {
      passwordHash: adminPasswordHash,
      roleId: superAdminRole.id,
    },
    create: {
      name: 'Erosae Master Administrator',
      email: 'admin@erosae.com',
      passwordHash: adminPasswordHash,
      roleId: superAdminRole.id,
    },
  });
  console.log('✅ Master Admin seeded (admin@erosae.com / Admin@Erosae2026!)');

  // Customer Account Demo
  const customerPasswordHash = await bcrypt.hash('Customer@123456', 12);
  const demoCustomer = await prisma.user.upsert({
    where: { email: 'customer@erosae.com' },
    update: {},
    create: {
      name: 'Tanvir Ahmed',
      email: 'customer@erosae.com',
      phone: '+8801711000000',
      passwordHash: customerPasswordHash,
      role: 'CUSTOMER',
      emailVerified: true,
      phoneVerified: true,
    },
  });

  await prisma.customerProfile.upsert({
    where: { userId: demoCustomer.id },
    update: {},
    create: {
      userId: demoCustomer.id,
      segment: 'REGULAR',
      totalOrdersCount: 2,
      totalSpentBDT: 15400.0,
      tagsJson: JSON.stringify(['Tech Enthusiast', 'Dhaka Central']),
    },
  });

  await prisma.loyaltyAccount.upsert({
    where: { userId: demoCustomer.id },
    update: {},
    create: {
      userId: demoCustomer.id,
      pointsTotal: 350,
    },
  });

  // ==========================================
  // 3. WAREHOUSES & STOCK LOCATIONS
  // ==========================================
  const centralWarehouse = await prisma.warehouse.upsert({
    where: { code: 'DHK-CENTRAL' },
    update: {},
    create: {
      name: 'Dhaka Central Hub & Fulfillment Center',
      code: 'DHK-CENTRAL',
      address: 'Plot 14, Block C, Banani Commercial Area',
      city: 'Dhaka',
      isPrimary: true,
      isActive: true,
    },
  });

  const ctgWarehouse = await prisma.warehouse.upsert({
    where: { code: 'CTG-HUB' },
    update: {},
    create: {
      name: 'Chattogram Port Logistics Depot',
      code: 'CTG-HUB',
      address: 'Agrabad C/A, Commercial Zone',
      city: 'Chattogram',
      isPrimary: false,
      isActive: true,
    },
  });
  console.log('✅ Warehouses initialized (Dhaka Central & Chattogram Hub).');

  // ==========================================
  // 4. CATEGORIES & BRANDS
  // ==========================================
  const brandAura = await prisma.brand.upsert({
    where: { slug: 'aura-sound' },
    update: {},
    create: {
      nameEn: 'AuraSound Labs',
      nameBn: 'অরা সাউন্ড ল্যাবস',
      slug: 'aura-sound',
      isFeatured: true,
      descriptionEn: 'High fidelity audio and smart noise-cancelling tech',
      descriptionBn: 'প্রিমিয়াম অডিও ও নয়েজ ক্যানসেলেশন অডিও গ্যাজেট',
    },
  });

  const brandTailored = await prisma.brand.upsert({
    where: { slug: 'erosae-tailored' },
    update: {},
    create: {
      nameEn: 'Erosae Tailored',
      nameBn: 'ইরোসে টেইলর্ড',
      slug: 'erosae-tailored',
      isFeatured: true,
      descriptionEn: 'Luxury business apparel and bespoke everyday wear',
      descriptionBn: 'উচ্চমানের ফর্মাল পোশাক ও আধুনিক লাইফস্টাইল ক্লদিং',
    },
  });

  const brandLumiere = await prisma.brand.upsert({
    where: { slug: 'lumiere-organics' },
    update: {},
    create: {
      nameEn: 'Lumière Organics',
      nameBn: 'লুমিয়ের অর্গানিকস',
      slug: 'lumiere-organics',
      isFeatured: true,
      descriptionEn: 'Dermatologist verified clean skincare and botanical serums',
      descriptionBn: 'বিশুদ্ধ প্রাকৃতিক উপাদান সমৃদ্ধ স্কিনকেয়ার সামগ্রী',
    },
  });

  const brandDigital = await prisma.brand.upsert({
    where: { slug: 'digital-vault' },
    update: {},
    create: {
      nameEn: 'Digital Vault Solutions',
      nameBn: 'ডিজিটাল ভল্ট সলিউশনস',
      slug: 'digital-vault',
      isFeatured: true,
      descriptionEn: 'Authorized resale subscription access and digital tools',
      descriptionBn: 'অনুমোদিত ডিজিটাল সার্ভিস ও প্রফেশনাল লাইসেন্স সাবস্ক্রিপশন',
    },
  });

  const catElectronics = await prisma.category.upsert({
    where: { slug: 'electronics' },
    update: {},
    create: {
      nameEn: 'Electronics & Smart Gadgets',
      nameBn: 'ইলেকট্রনিক্স ও স্মার্ট গ্যাজেট',
      slug: 'electronics',
      descriptionEn: 'High performance audio, wearables, and cutting-edge tech accessories',
      descriptionBn: 'সর্বাধুনিক অডিও গিয়ার, স্মার্টওয়াচ এবং প্রিমিয়াম টেক সামগ্রী',
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
      sortOrder: 1,
    },
  });

  const catFashion = await prisma.category.upsert({
    where: { slug: 'fashion' },
    update: {},
    create: {
      nameEn: 'Men & Women Luxury Fashion',
      nameBn: 'ফ্যাশন ও প্রিমিয়াম পোশাক',
      slug: 'fashion',
      descriptionEn: 'Tailored luxury cotton apparel, casual shirts, and accessories',
      descriptionBn: '১০০% পিওর কটন ফর্মাল শার্ট, ক্যাজুয়াল ওয়্যার ও লাইফস্টাইল কালেকশন',
      image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=800&auto=format&fit=crop&q=80',
      sortOrder: 2,
    },
  });

  const catBeauty = await prisma.category.upsert({
    where: { slug: 'beauty-wellness' },
    update: {},
    create: {
      nameEn: 'Beauty, Skincare & Wellness',
      nameBn: 'স্কিনকেয়ার ও বিউটি সামগ্রী',
      slug: 'beauty-wellness',
      descriptionEn: 'Natural serums, moisturizers, and facial care essentials',
      descriptionBn: 'ত্বকের যত্ন ও উজ্জ্বলতা বৃদ্ধির জন্য কার্যকরী অর্গানিক স্কিনকেয়ার পণ্য',
      image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&auto=format&fit=crop&q=80',
      sortOrder: 3,
    },
  });

  const catDigital = await prisma.category.upsert({
    where: { slug: 'digital-services' },
    update: {},
    create: {
      nameEn: 'Digital Subscriptions & Software Keys',
      nameBn: 'ডিজিটাল সার্ভিস ও সাবস্ক্রিপশন',
      slug: 'digital-services',
      descriptionEn: 'Official resale subscriptions for productivity, AI services, and design tools',
      descriptionBn: 'উৎপাদনশীলতা ও ডিজাইনের জন্য অনুমোদিত ডিজিটাল সফটওয়্যার ও সার্ভিস অ্যাক্সেস',
      image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
      sortOrder: 4,
    },
  });

  console.log('✅ Categories and Brands seeded.');

  // ==========================================
  // 5. DYNAMIC ATTRIBUTES
  // ==========================================
  const attrColor = await prisma.attribute.upsert({
    where: { code: 'color' },
    update: {},
    create: {
      nameEn: 'Color',
      nameBn: 'রঙ',
      code: 'color',
      type: 'COLOR',
    },
  });

  const valBlack = await prisma.attributeValue.create({
    data: { attributeId: attrColor.id, valueEn: 'Midnight Black', valueBn: 'মিডনাইট ব্ল্যাক', colorHex: '#1A1A1A' },
  });
  const valSilver = await prisma.attributeValue.create({
    data: { attributeId: attrColor.id, valueEn: 'Platinum Silver', valueBn: 'প্ল্যাটিনাম সিলভার', colorHex: '#E5E5E5' },
  });

  const attrSize = await prisma.attribute.upsert({
    where: { code: 'size' },
    update: {},
    create: {
      nameEn: 'Size',
      nameBn: 'সাইজ',
      code: 'size',
      type: 'SELECT',
    },
  });

  const valM = await prisma.attributeValue.create({
    data: { attributeId: attrSize.id, valueEn: 'M (Medium)', valueBn: 'এম (মিডিয়াম)' },
  });
  const valL = await prisma.attributeValue.create({
    data: { attributeId: attrSize.id, valueEn: 'L (Large)', valueBn: 'এল (লার্জ)' },
  });
  const valXL = await prisma.attributeValue.create({
    data: { attributeId: attrSize.id, valueEn: 'XL (Extra Large)', valueBn: 'এক্সএল (এক্সট্রা লার্জ)' },
  });

  console.log('✅ Dynamic Attributes (Color, Size) initialized.');

  // ==========================================
  // 6. MULTI-TYPE PRODUCTS & INVENTORY
  // ==========================================
  // Product 1: Physical Tech Product
  const p1 = await prisma.product.upsert({
    where: { slug: 'aura-wireless-headphones-pro' },
    update: {},
    create: {
      type: 'PHYSICAL',
      titleEn: 'Aura Sound Pro ANC Wireless Over-Ear Headphones',
      titleBn: 'অরা সাউন্ড প্রো নয়েজ-ক্যানসেলিং প্রিমিয়াম ওয়্যারলেস হেডফোন',
      slug: 'aura-wireless-headphones-pro',
      descriptionEn: 'Experience pure sonic brilliance with active hybrid noise cancellation, studio-tuned 40mm drivers, and 45-hour ultra endurance battery.',
      descriptionBn: 'অসাধারণ স্টুডিও সাউন্ড ও হাইব্রিড নয়েজ ক্যানসেলেশন সমৃদ্ধ প্রিমিয়াম হেডফোন। ৪৫ ঘণ্টার দীর্ঘ ব্যাটারি ব্যাকআপ ও নরম ইয়ারকাপ আরামদায়ক অভিজ্ঞতা প্রদান করে।',
      shortDescEn: 'Active Noise Cancellation • 45h Battery • Spatial Audio',
      shortDescBn: 'অ্যাক্টিভ নয়েজ ক্যানসেলেশন • ৪৫ ঘণ্টা ব্যাটারি • থ্রিডি সাউন্ড',
      basePriceBDT: 17500.0,
      comparePriceBDT: 21999.0,
      costPriceBDT: 12000.0,
      sku: 'ERO-TECH-ANC-01',
      brandId: brandAura.id,
      categoryId: catElectronics.id,
      isFeatured: true,
      hasVariants: true,
      weightGrams: 280,
      ratingAverage: 4.9,
      ratingCount: 142,
    },
  });

  await prisma.productImage.createMany({
    data: [
      { productId: p1.id, url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80', isPrimary: true, sortOrder: 0, altEn: 'Aura Sound Pro Headphones Front' },
      { productId: p1.id, url: 'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&auto=format&fit=crop&q=80', isPrimary: false, sortOrder: 1, altEn: 'Aura Sound Pro Side View' },
    ],
  });

  const p1v1 = await prisma.productVariant.create({
    data: {
      productId: p1.id,
      sku: 'ERO-TECH-ANC-01-BLK',
      nameEn: 'Midnight Black',
      nameBn: 'মিডনাইট ব্ল্যাক',
      priceBDT: 17500.0,
      comparePriceBDT: 21999.0,
      costPriceBDT: 12000.0,
      stockQuantity: 45,
      attributesJson: JSON.stringify({ color: 'Midnight Black' }),
    },
  });

  const p1v2 = await prisma.productVariant.create({
    data: {
      productId: p1.id,
      sku: 'ERO-TECH-ANC-01-SLV',
      nameEn: 'Platinum Silver',
      nameBn: 'প্ল্যাটিনাম সিলভার',
      priceBDT: 18000.0,
      comparePriceBDT: 22500.0,
      costPriceBDT: 12500.0,
      stockQuantity: 30,
      attributesJson: JSON.stringify({ color: 'Platinum Silver' }),
    },
  });

  await prisma.inventoryItem.create({
    data: {
      warehouseId: centralWarehouse.id,
      productId: p1.id,
      variantId: p1v1.id,
      quantityOnHand: 45,
      quantityAvailable: 45,
    },
  });

  await prisma.inventoryItem.create({
    data: {
      warehouseId: centralWarehouse.id,
      productId: p1.id,
      variantId: p1v2.id,
      quantityOnHand: 30,
      quantityAvailable: 30,
    },
  });

  // Product 2: Physical Luxury Apparel
  const p2 = await prisma.product.upsert({
    where: { slug: 'classic-oxford-pure-cotton-shirt' },
    update: {},
    create: {
      type: 'PHYSICAL',
      titleEn: 'Signature Tailored Pure Giza Cotton Formal Shirt',
      titleBn: 'সিগনেচার টেইলর্ড ১০০% পিওর গিজা কটন ফর্মাল শার্ট',
      slug: 'classic-oxford-pure-cotton-shirt',
      descriptionEn: 'Tailored from long-staple 100% Egyptian Giza cotton. Wrinkle-resistant luxury finish, mother-of-pearl buttons, and structured comfort collar.',
      descriptionBn: '১০০% মিশরীয় গিজা কটন কাপড়ে তৈরি অত্যন্ত আরামদায়ক ও নিখুঁত ফিটের ফর্মাল শার্ট। অফিস ও যেকোনো ফর্মাল মিটিংয়ের জন্য আদর্শ।',
      shortDescEn: '100% Egyptian Giza Cotton • Non-Iron Finish • Luxury Fit',
      shortDescBn: '১০০% পিওর গিজা কটন • নন-আয়রন ফিনিশ • প্রিমিয়াম ফিট',
      basePriceBDT: 3450.0,
      comparePriceBDT: 4500.0,
      costPriceBDT: 2100.0,
      sku: 'ERO-FASH-SHT-02',
      brandId: brandTailored.id,
      categoryId: catFashion.id,
      isFeatured: true,
      hasVariants: true,
      weightGrams: 220,
      ratingAverage: 4.8,
      ratingCount: 96,
    },
  });

  await prisma.productImage.create({
    data: {
      productId: p2.id,
      url: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&auto=format&fit=crop&q=80',
      isPrimary: true,
      sortOrder: 0,
      altEn: 'Signature White Cotton Shirt',
    },
  });

  const p2v1 = await prisma.productVariant.create({
    data: {
      productId: p2.id,
      sku: 'ERO-FASH-SHT-02-WHT-M',
      nameEn: 'White / Size M',
      nameBn: 'সাদা / সাইজ এম',
      priceBDT: 3450.0,
      comparePriceBDT: 4500.0,
      costPriceBDT: 2100.0,
      stockQuantity: 40,
      attributesJson: JSON.stringify({ color: 'White', size: 'M' }),
    },
  });

  const p2v2 = await prisma.productVariant.create({
    data: {
      productId: p2.id,
      sku: 'ERO-FASH-SHT-02-WHT-L',
      nameEn: 'White / Size L',
      nameBn: 'সাদা / সাইজ এল',
      priceBDT: 3450.0,
      comparePriceBDT: 4500.0,
      costPriceBDT: 2100.0,
      stockQuantity: 50,
      attributesJson: JSON.stringify({ color: 'White', size: 'L' }),
    },
  });

  await prisma.inventoryItem.create({
    data: {
      warehouseId: centralWarehouse.id,
      productId: p2.id,
      variantId: p2v1.id,
      quantityOnHand: 40,
      quantityAvailable: 40,
    },
  });

  // Product 3: Physical Organic Skincare
  const p3 = await prisma.product.upsert({
    where: { slug: 'botanical-radiance-vitamin-c-serum' },
    update: {},
    create: {
      type: 'PHYSICAL',
      titleEn: 'Botanical Radiance Triple Vitamin-C Brightening Serum 50ml',
      titleBn: 'বোটানিক্যাল ট্রিপল ভিটামিন-সি গ্লো অ্যান্ড ব্রাইটনিং সিরাম ৫০ মি.লি.',
      slug: 'botanical-radiance-vitamin-c-serum',
      descriptionEn: 'Potent 20% stabilized Vitamin C complex enriched with Hyaluronic acid and Niacinamide to restore skin radiance, fade dark spots, and hydrate deeply.',
      descriptionBn: 'ত্বকের গভীর থেকে দাগ দূর করে প্রাকৃতিক উজ্জ্বলতা ফিরিয়ে আনতে কার্যকরী ২০% ভিটামিন-সি, হায়ালুরোনিক অ্যাসিড ও নিয়াসিনামাইড সমৃদ্ধ প্রাকৃতিক স্কিন সিরাম।',
      shortDescEn: '20% Vitamin C • Hyaluronic Acid • Dermatologically Tested',
      shortDescBn: '২০% ভিটামিন সি • হায়ালুরোনিক অ্যাসিড • চর্মরোগ বিশেষজ্ঞ কর্তৃক পরীক্ষিত',
      basePriceBDT: 2450.0,
      comparePriceBDT: 3200.0,
      costPriceBDT: 1300.0,
      sku: 'ERO-BEAUTY-SRM-03',
      brandId: brandLumiere.id,
      categoryId: catBeauty.id,
      isFeatured: true,
      hasVariants: false,
      weightGrams: 150,
      ratingAverage: 4.9,
      ratingCount: 220,
    },
  });

  await prisma.productImage.create({
    data: {
      productId: p3.id,
      url: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&auto=format&fit=crop&q=80',
      isPrimary: true,
      sortOrder: 0,
      altEn: 'Botanical Vitamin C Serum Bottle',
    },
  });

  await prisma.inventoryItem.create({
    data: {
      warehouseId: centralWarehouse.id,
      productId: p3.id,
      quantityOnHand: 120,
      quantityAvailable: 120,
    },
  });

  // Product 4: Third-Party Resale Subscription Service
  const p4 = await prisma.product.upsert({
    where: { slug: 'pro-designer-suite-1-month' },
    update: {},
    create: {
      type: 'SUBSCRIPTION_SERVICE',
      titleEn: 'Pro Creative Design Suite - 1 Month Full Access Pass',
      titleBn: 'প্রো ক্রিয়েটিভ ডিজাইন সুইট - ১ মাসের প্রফেশনাল অ্যাক্সেস পাস',
      slug: 'pro-designer-suite-1-month',
      descriptionEn: 'Full 30-day private access to professional graphics, cloud storage, premium templates, and generative AI features.',
      descriptionBn: 'প্রফেশনাল গ্রাফিক্স ডিজাইন, ক্লাউড স্টোরেজ ও এআই ফিচারের জন্য ১ মাসের ফুল অ্যাক্সেস সার্ভিস। অর্ডার সম্পন্ন করার সাথে সাথে অ্যাক্সেস গাইড ও ক্রেডেনশিয়ালস পাঠানো হয়।',
      shortDescEn: '30-Day Resale Access • Instant Activation • 100% Replacement Warranty',
      shortDescBn: '৩০ দিনের প্রাইভেট অ্যাক্সেস • দ্রুত অ্যাক্টিভেশন • ফুল রিপ্লেসমেন্ট সাপোর্ট',
      basePriceBDT: 1850.0,
      comparePriceBDT: 2500.0,
      costPriceBDT: 1100.0,
      sku: 'ERO-DIGI-DSN-04',
      brandId: brandDigital.id,
      categoryId: catDigital.id,
      isFeatured: true,
      hasVariants: false,
      ratingAverage: 5.0,
      ratingCount: 64,
    },
  });

  await prisma.productImage.create({
    data: {
      productId: p4.id,
      url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
      isPrimary: true,
      sortOrder: 0,
      altEn: 'Creative Design Cloud Access Pass',
    },
  });

  await prisma.subscriptionProductConfig.create({
    data: {
      productId: p4.id,
      thirdPartyServiceName: 'Canva Pro Enterprise Resale Tier',
      durationMonths: 1,
      activationGuideEn: 'You will receive an official invitation link in your registered email. Click Accept to activate your workspace instantly.',
      activationGuideBn: 'আপনার ইমেইলে অফিসিয়াল ইনভাইটেশন লিংক পাঠানো হবে। লিংকে ক্লিক করে এক ক্লিকেই অ্যাক্টিভেট করুন।',
      disclosureNoticeEn: 'Erosae.com is an independent digital merchant. All brand names belong to their respective trademark holders.',
      disclosureNoticeBn: 'ইরোসে ডট কম একটি স্বাধীন ডিজিটাল মার্চেন্ট। সমস্ত ট্রেডমার্ক স্ব-স্ব কোম্পানির মালিকানাধীন।',
      autoFulfillSupported: true,
    },
  });

  // Product 5: Digital License Key Product
  const p5 = await prisma.product.upsert({
    where: { slug: 'os-professional-workstation-license' },
    update: {},
    create: {
      type: 'LICENSE_KEY',
      titleEn: 'Windows 11 Pro Genuine Lifetime Activation Key',
      titleBn: 'উইন্ডোজ ১১ প্রো জেনুইন লাইফটাইম অ্যাক্টিভেশন কি',
      slug: 'os-professional-workstation-license',
      descriptionEn: 'Genuine lifetime single-PC activation key for Windows 11 Professional. Supports all languages, 32/64 bit, and official Microsoft updates.',
      descriptionBn: 'উইন্ডোজ ১১ প্রফেশনাল অপারেটিং সিস্টেমের জন্য জেনুইন লাইফটাইম লাইসেন্স কি। সম্পূর্ণ অফিসিয়াল মাইক্রোসফট আপডেট সমর্থিত।',
      shortDescEn: 'Lifetime License • Instant Automated Delivery • 1 PC',
      shortDescBn: 'লাইফটাইম লাইসেন্স • সাথে সাথে অটোমেটেড ডেলিভারি • ১টি পিসির জন্য',
      basePriceBDT: 1450.0,
      comparePriceBDT: 2900.0,
      costPriceBDT: 750.0,
      sku: 'ERO-DIGI-WIN-05',
      brandId: brandDigital.id,
      categoryId: catDigital.id,
      isFeatured: true,
      hasVariants: false,
      ratingAverage: 4.9,
      ratingCount: 180,
    },
  });

  await prisma.productImage.create({
    data: {
      productId: p5.id,
      url: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=800&auto=format&fit=crop&q=80',
      isPrimary: true,
      sortOrder: 0,
      altEn: 'OS License Digital Box',
    },
  });

  const keyPool = await prisma.licenseKeyPool.create({
    data: {
      productId: p5.id,
      name: 'Windows 11 Pro OEM Batch 2026',
    },
  });

  await prisma.licenseKey.createMany({
    data: [
      { poolId: keyPool.id, keyEncrypted: 'W269N-WFGWX-YVC9B-4J6C9-T83GX', status: 'AVAILABLE' },
      { poolId: keyPool.id, keyEncrypted: 'MH37W-N47XK-V7XM9-C7227-GCQG9', status: 'AVAILABLE' },
      { poolId: keyPool.id, keyEncrypted: 'NRG8B-VKK3Q-CXVCJ-9G2XF-6Q84J', status: 'AVAILABLE' },
    ],
  });

  console.log('✅ Physical, Subscription, and License Key products seeded.');

  // ==========================================
  // 7. PAYMENT GATEWAY CONFIGURATIONS
  // ==========================================
  const gateways = [
    {
      code: 'COD',
      nameEn: 'Cash on Delivery (COD)',
      nameBn: 'ক্যাশ অন ডেলিভারি (পণ্য হাতে পেয়ে মূল্য পরিশোধ)',
      isEnabled: true,
      isLiveMode: true,
      supportedCurrencies: JSON.stringify(['BDT', 'USD', 'AED', 'SAR', 'EUR', 'GBP', 'INR']),
      credentialsEnc: '{}',
      settingsJson: JSON.stringify({ advanceRequiredInsideDhaka: 0, advanceOutsideDhaka: 150 }),
      sortOrder: 1,
    },
    {
      code: 'BKASH',
      nameEn: 'bKash Online Payment (Instant)',
      nameBn: 'বিকাশ অনলাইন পেমেন্ট (তাৎক্ষণিক)',
      isEnabled: true,
      isLiveMode: false,
      supportedCurrencies: JSON.stringify(['BDT']),
      credentialsEnc: JSON.stringify({ appKey: 'demo_bkash_key', appSecret: 'demo_bkash_secret', username: 'demo_user', password: 'demo_password' }),
      settingsJson: JSON.stringify({ webhookUrl: '/api/webhooks/bkash', autoRefundEnabled: true }),
      sortOrder: 2,
    },
    {
      code: 'NAGAD',
      nameEn: 'Nagad Gateway',
      nameBn: 'নগদ অনলাইন পেমেন্ট',
      isEnabled: true,
      isLiveMode: false,
      supportedCurrencies: JSON.stringify(['BDT']),
      credentialsEnc: JSON.stringify({ merchantId: 'demo_nagad_id', privateKey: 'demo_private_key' }),
      settingsJson: JSON.stringify({ webhookUrl: '/api/webhooks/nagad' }),
      sortOrder: 3,
    },
    {
      code: 'SSLCOMMERZ',
      nameEn: 'SSLCommerz (Cards / Internet Banking)',
      nameBn: 'এসএসএল কমার্জ (ভিসা, মাস্টারকার্ড ও নেট ব্যাংকিং)',
      isEnabled: true,
      isLiveMode: false,
      supportedCurrencies: JSON.stringify(['BDT', 'USD']),
      credentialsEnc: JSON.stringify({ storeId: 'demo_ssl_store', storePass: 'demo_ssl_pass' }),
      settingsJson: JSON.stringify({ ipnUrl: '/api/webhooks/sslcommerz' }),
      sortOrder: 4,
    },
    {
      code: 'STRIPE',
      nameEn: 'Stripe International Cards (Visa / Mastercard / Apple Pay)',
      nameBn: 'স্ট্রাইপ ইন্টারন্যাশনাল পেমেন্ট (ভিসা, মাস্টারকার্ড ও অ্যাপল পে)',
      isEnabled: true,
      isLiveMode: false,
      supportedCurrencies: JSON.stringify(['USD', 'EUR', 'GBP', 'AED', 'SAR']),
      credentialsEnc: JSON.stringify({ publishableKey: 'pk_test_demo', secretKey: 'sk_test_demo' }),
      settingsJson: JSON.stringify({ webhookSecret: 'whsec_demo' }),
      sortOrder: 5,
    },
  ];

  for (const gw of gateways) {
    await prisma.paymentGatewayConfig.upsert({
      where: { code: gw.code },
      update: gw,
      create: gw,
    });
  }
  console.log('✅ Payment Gateways configured (COD, bKash, Nagad, SSLCommerz, Stripe).');

  // ==========================================
  // 8. SHIPPING ZONES & RATES
  // ==========================================
  const zoneInsideDhaka = await prisma.shippingZone.upsert({
    where: { code: 'INSIDE_DHAKA' },
    update: {},
    create: {
      code: 'INSIDE_DHAKA',
      nameEn: 'Inside Dhaka City (Fast Delivery)',
      nameBn: 'ঢাকা সিটির ভিতরে (দ্রুত ডেলিভারি)',
      countriesJson: JSON.stringify(['BD']),
      districtsJson: JSON.stringify(['Dhaka']),
      isActive: true,
    },
  });

  await prisma.shippingRate.create({
    data: {
      zoneId: zoneInsideDhaka.id,
      titleEn: 'Standard Home Delivery (24-48 Hours)',
      titleBn: 'স্ট্যান্ডার্ড হোম ডেলিভারি (২৪-৪৮ ঘণ্টা)',
      rateBDT: 70.0,
      freeAboveBDT: 2500.0,
      estimatedDays: '1-2 Days',
    },
  });

  const zoneOutsideDhaka = await prisma.shippingZone.upsert({
    where: { code: 'OUTSIDE_DHAKA' },
    update: {},
    create: {
      code: 'OUTSIDE_DHAKA',
      nameEn: 'Outside Dhaka / Nationwide All Districts',
      nameBn: 'ঢাকার বাইরে / সারাদেশের সকল জেলায়',
      countriesJson: JSON.stringify(['BD']),
      districtsJson: JSON.stringify([]),
      isActive: true,
    },
  });

  await prisma.shippingRate.create({
    data: {
      zoneId: zoneOutsideDhaka.id,
      titleEn: 'Nationwide Courier Delivery (Steadfast / Pathao)',
      titleBn: 'সারাদেশে হোম ডেলিভারি (স্টেডফাস্ট / পাঠাও)',
      rateBDT: 130.0,
      freeAboveBDT: 5000.0,
      estimatedDays: '2-4 Days',
    },
  });

  console.log('✅ Shipping zones configured for Inside Dhaka (৳70) & Nationwide (৳130).');

  // ==========================================
  // 9. COURIER INTEGRATIONS
  // ==========================================
  await prisma.courierConfig.upsert({
    where: { code: 'STEADFAST' },
    update: {},
    create: {
      code: 'STEADFAST',
      name: 'Steadfast Courier Bangladesh',
      isEnabled: true,
      isLiveMode: false,
      credentialsEnc: JSON.stringify({ apiKey: 'demo_steadfast_key', secretKey: 'demo_steadfast_secret' }),
      settingsJson: JSON.stringify({ autoConsignmentOnPack: true, webhookUrl: '/api/webhooks/steadfast' }),
    },
  });

  await prisma.courierConfig.upsert({
    where: { code: 'PATHAO' },
    update: {},
    create: {
      code: 'PATHAO',
      name: 'Pathao Courier API',
      isEnabled: true,
      isLiveMode: false,
      credentialsEnc: JSON.stringify({ clientId: 'demo_pathao_id', clientSecret: 'demo_pathao_secret' }),
      settingsJson: JSON.stringify({ storeId: '1001', webhookUrl: '/api/webhooks/pathao' }),
    },
  });
  console.log('✅ Courier configurations seeded (Steadfast & Pathao).');

  // ==========================================
  // 10. POLICIES & COMPLIANCE
  // ==========================================
  const policies = [
    {
      type: 'TERMS',
      slug: 'terms-and-conditions',
      titleEn: 'Terms & Conditions of Service',
      titleBn: 'ব্যবহারের নিয়ম ও শর্তাবলী',
      contentEn: '## 1. Acceptance of Terms\nBy accessing and placing an order on Erosae.com, you confirm agreement to our terms.\n\n## 2. Orders & Pricing\nPrices are displayed in BDT (৳) with optional multi-currency conversion. Orders are subject to verification.',
      contentBn: '## ১. শর্তাবলীর সম্মতি\nইরোসে ডট কমে প্রবেশ করে অথবা যেকোনো অর্ডার সম্পন্ন করার মাধ্যমে আপনি আমাদের শর্তাবলীর সাথে সম্মত হচ্ছেন।\n\n## ২. পণ্যের মূল্য ও পেমেন্ট\nওয়েবসাইটের মূল মূল্য বাংলাদেশী টাকায় (৳) নির্ধারিত। প্রতিটি অর্ডার যাচাইকরণ সাপেক্ষে কার্যকর হবে।',
    },
    {
      type: 'RETURN_REFUND',
      slug: 'return-and-refund-policy',
      titleEn: 'Return, Replacement & Refund Policy',
      titleBn: 'রিটার্ন, রিপ্লেসমেন্ট ও রিফান্ড পলিসি',
      contentEn: '## 1. Return Window\nYou may request a return within 7 calendar days of delivery for damaged or incorrect items.\n\n## 2. Refund Processing\nApproved refunds are issued within 5-7 business days to your original payment method or via bKash.',
      contentBn: '## ১. রিটার্নের সময়সীমা\nপণ্য ডেলিভারি পাওয়ার ৭ কার্যদিবসের মধ্যে যেকোনো ত্রুটিপূর্ণ বা ভুল পণ্যের ক্ষেত্রে রিটার্ন বা রিপ্লেসমেন্ট অনুরোধ করতে পারবেন।\n\n## ২. রিফান্ড প্রক্রিয়া\nঅনুমোদিত রিফান্ড ৫-৭ কার্যদিবসের মধ্যে আপনার মূল পেমেন্ট মাধ্যম অথবা বিকাশের মাধ্যমে সম্পন্ন হবে।',
    },
    {
      type: 'PRIVACY',
      slug: 'privacy-policy',
      titleEn: 'Privacy & Data Protection Policy',
      titleBn: 'গোপনীয়তা ও তথ্য সুরক্ষা নীতি',
      contentEn: '## 1. Data Collection\nWe only collect essential customer information necessary for fulfillment and communication.\n\n## 2. Security\nCustomer credentials and payment data are encrypted with industry-standard protocols.',
      contentBn: '## ১. তথ্য সংগ্রহ\nঅর্ডার ডেলিভারি ও প্রয়োজনীয় যোগাযোগের জন্য আবশ্যক তথ্যসমূহ সংগ্রহ করা হয়।\n\n## ২. তথ্য নিরাপত্তা\nআপনার ব্যক্তিগত তথ্য ও পেমেন্ট হিস্ট্রি অত্যাধুনিক এনক্রিপশন দ্বারা সম্পূর্ণ নিরাপদ রাখা হয়।',
    },
    {
      type: 'DIGITAL_TERMS',
      slug: 'digital-product-terms',
      titleEn: 'Digital Goods & Subscription Disclaimers',
      titleBn: 'ডিজিটাল পণ্য ও সাবস্ক্রিপশন সংক্রান্ত শর্তাবলী',
      contentEn: '## 1. Delivery of Credentials\nDigital access codes and subscription details are delivered automatically via email and account dashboard upon payment confirmation.',
      contentBn: '## ১. ডিজিটাল ডেলিভারি\nডিজিটাল লাইসেন্স ও সার্ভিস অ্যাক্সেস পেমেন্ট নিশ্চিত হওয়ার সাথে সাথে ইমেইল ও ড্যাশবোর্ডে প্রদান করা হয়।',
    },
  ];

  for (const pol of policies) {
    const createdPol = await prisma.policy.upsert({
      where: { type: pol.type },
      update: { titleEn: pol.titleEn, titleBn: pol.titleBn },
      create: {
        type: pol.type,
        slug: pol.slug,
        titleEn: pol.titleEn,
        titleBn: pol.titleBn,
      },
    });

    await prisma.policyVersion.upsert({
      where: {
        policyId_versionNumber: {
          policyId: createdPol.id,
          versionNumber: 1,
        },
      },
      update: {},
      create: {
        policyId: createdPol.id,
        versionNumber: 1,
        contentEn: pol.contentEn,
        contentBn: pol.contentBn,
        status: 'PUBLISHED',
        approvedBy: 'Master Administrator',
      },
    });
  }
  console.log('✅ Policy & Compliance Versioning initialized.');

  // ==========================================
  // 11. ERP & DOUBLE-ENTRY CHART OF ACCOUNTS
  // ==========================================
  const chartOfAccounts = [
    { code: '1010', name: 'Cash on Hand / Main Vault', type: 'ASSET' },
    { code: '1020', name: 'bKash Merchant Settlement Account', type: 'ASSET' },
    { code: '1030', name: 'Nagad Merchant Settlement Account', type: 'ASSET' },
    { code: '1040', name: 'SSLCommerz Gateway Receivable', type: 'ASSET' },
    { code: '1050', name: 'Steadfast / Pathao Courier COD Receivable', type: 'ASSET' },
    { code: '1200', name: 'Merchandise Inventory Asset', type: 'ASSET' },
    { code: '2010', name: 'Accounts Payable - Suppliers', type: 'LIABILITY' },
    { code: '2020', name: 'Customer Advance & Store Credit Liability', type: 'LIABILITY' },
    { code: '3000', name: 'Owner Equity & Retained Earnings', type: 'EQUITY' },
    { code: '4010', name: 'Physical Goods Sales Revenue', type: 'REVENUE' },
    { code: '4020', name: 'Digital Services Sales Revenue', type: 'REVENUE' },
    { code: '4030', name: 'Shipping Fee Collected Revenue', type: 'REVENUE' },
    { code: '5010', name: 'Cost of Goods Sold (COGS)', type: 'EXPENSE' },
    { code: '5020', name: 'Payment Gateway Processing Fees', type: 'EXPENSE' },
    { code: '5030', name: 'Courier Freight & Fulfillment Expense', type: 'EXPENSE' },
  ];

  for (const acc of chartOfAccounts) {
    await prisma.account.upsert({
      where: { code: acc.code },
      update: acc,
      create: acc,
    });
  }
  console.log('✅ ERP Double-Entry Chart of Accounts seeded.');

  // ==========================================
  // 12. PROMOTIONAL COUPONS
  // ==========================================
  await prisma.coupon.upsert({
    where: { code: 'WELCOME10' },
    update: {},
    create: {
      code: 'WELCOME10',
      descriptionEn: '10% discount on first order for new customers',
      descriptionBn: 'নতুন গ্রাহকদের জন্য প্রথম অর্ডারে ১০% বিশেষ ছাড়',
      discountType: 'PERCENTAGE',
      discountValue: 10.0,
      minSpendBDT: 2000.0,
      maxDiscountBDT: 1000.0,
      isActive: true,
    },
  });

  await prisma.coupon.upsert({
    where: { code: 'FREESHIP' },
    update: {},
    create: {
      code: 'FREESHIP',
      descriptionEn: 'Free standard shipping across Bangladesh on orders over ৳3,000',
      descriptionBn: '৩,০০০ টাকার বেশি অর্ডারে সারাদেশে ফ্রি হোম ডেলিভারি',
      discountType: 'FREE_SHIPPING',
      discountValue: 0.0,
      minSpendBDT: 3000.0,
      isActive: true,
    },
  });
  console.log('✅ Promotional Coupons seeded (WELCOME10, FREESHIP).');

  // ==========================================
  // 13. CMS HERO BANNERS
  // ==========================================
  await prisma.banner.createMany({
    data: [
      {
        titleEn: 'Curated Elegance & Modern Innovation',
        titleBn: 'অভিজাত লাইফস্টাইল ও আধুনিক টেকনোলজির মিলনমেলা',
        subtitleEn: 'Explore luxury fashion, studio-grade audio, and verified digital software suites with nationwide express delivery.',
        subtitleBn: 'প্রিমিয়াম ফ্যাশন, উন্নত অডিও গ্যাজেট এবং অথেনটিক ডিজিটাল সার্ভিসের বিশ্বস্ত ঠিকানা। সারাদেশে দ্রুত ডেলিভারি সুবিধা।',
        badgeEn: 'New 2026 Collection',
        badgeBn: 'নতুন ২০২৬ কালেকশন',
        imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&auto=format&fit=crop&q=85',
        linkUrl: '/products',
        position: 'HERO',
        sortOrder: 1,
      },
    ],
  });
  console.log('✅ CMS Hero Banners initialized.');

  console.log('🎉 MASTER DATABASE SEEDING COMPLETED SUCCESSFULLY!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
