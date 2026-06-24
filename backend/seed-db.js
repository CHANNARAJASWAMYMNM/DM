const supabase = require('./config/supabase');
const bcrypt = require('bcryptjs');

async function seed() {
  console.log('🌱 Starting database seeding using Supabase client...');

  try {
    // 1. Generate password hash
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('password123', salt);

    console.log('1️⃣ Seeding users...');
    const users = [
      {
        id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
        email: 'admin@artify.com',
        password_hash: passwordHash,
        role: 'admin',
        name: 'Artify Admin',
        phone: '+91 9999999999'
      },
      {
        id: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e',
        email: 'suresh@artify.com',
        password_hash: passwordHash,
        role: 'seller',
        name: 'Suresh Kumar',
        phone: '+91 8888888888'
      },
      {
        id: 'c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f',
        email: 'radha@artify.com',
        password_hash: passwordHash,
        role: 'seller',
        name: 'Radha Devi',
        phone: '+91 7777777777'
      },
      {
        id: 'd4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a',
        email: 'customer@artify.com',
        password_hash: passwordHash,
        role: 'customer',
        name: 'Amit Sharma',
        phone: '+91 9876543210'
      }
    ];

    // Delete existing users to prevent constraint conflicts
    await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('seller_profiles').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('users').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    const { error: userError } = await supabase.from('users').insert(users);
    if (userError) throw userError;
    console.log('✅ Users seeded successfully!');

    console.log('2️⃣ Seeding seller profiles...');
    const sellerProfiles = [
      {
        id: 'e5f6a7b8-c9d0-1e2f-3a4b-5c6d7e8f9a0b',
        user_id: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e',
        business_name: 'Kumhar Gram Terracotta',
        story: 'I have been shaping riverbed clay since my childhood in Kumhar Gram. Each piece is fired in a wood-fueled kiln, giving it the natural variations of fire and earth. Cookware made of this clay naturally retains food nutrients.',
        craft_type: 'Terracotta Clay Cookware & Pots',
        city: 'New Delhi',
        state: 'Delhi',
        upi_id: 'suresh@okaxis',
        bank_details: 'A/C: 1002003004, SBI, Kumhar Gram Branch',
        is_approved: true
      },
      {
        id: 'f6a7b8c9-d0e1-2f3a-4b5c-6d7e8f9a0b1c',
        user_id: 'c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f', // Radha Devi
        business_name: 'Radha Handlooms',
        story: 'Taught by my grandmother, I spin organic cotton on a hand-operated charkha. Our handloom stoles take up to three days of manual weaving and use 100% natural vegetable dyes (indigo, madder root, and turmeric).',
        craft_type: 'Handwoven Stoles & Cotton Rugs',
        city: 'Bhagalpur',
        state: 'Bihar',
        upi_id: 'radha@okicici',
        bank_details: 'A/C: 5006007008, PNB, Bhagalpur Branch',
        is_approved: true
      }
    ];

    const { error: profileError } = await supabase.from('seller_profiles').insert(sellerProfiles);
    if (profileError) throw profileError;
    console.log('✅ Seller profiles seeded successfully!');

    console.log('3️⃣ Seeding products...');
    const products = [
      {
        id: '11111111-1111-1111-1111-111111111111',
        seller_id: 'e5f6a7b8-c9d0-1e2f-3a4b-5c6d7e8f9a0b',
        name: 'Traditional Terracotta Water Pot',
        description: 'Keep your water cool naturally during summers. Crafted using high porosity clay from the Yamuna riverbeds. Includes clay lid.',
        price: 18.50,
        stock: 15,
        image_url: 'https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?w=600',
        category: 'Ceramics',
        tags: ['pottery', 'clay pot', 'kitchenware']
      },
      {
        id: '22222222-2222-2222-2222-222222222222',
        seller_id: 'e5f6a7b8-c9d0-1e2f-3a4b-5c6d7e8f9a0b',
        name: 'Terracotta Biryani Handi (Clay Cookware)',
        description: 'Organic earthenware handi suitable for gas stoves and wood ovens. Cooking in clay balances the pH level of foods.',
        price: 24.00,
        stock: 8,
        image_url: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=600',
        category: 'Ceramics',
        tags: ['cookware', 'handi', 'organic']
      },
      {
        id: '33333333-3333-3333-3333-333333333333',
        seller_id: 'f6a7b8c9-d0e1-2f3a-4b5c-6d7e8f9a0b1c',
        name: 'Organic Indigo Handloom stole',
        description: 'Handwoven stole dyed in natural indigo. Perfect accessory for linen outfits. Breathable and soft cotton texture.',
        price: 32.00,
        stock: 5,
        image_url: 'https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?w=600',
        category: 'Textiles',
        tags: ['handloom', 'indigo', 'cotton', 'stole']
      },
      {
        id: '44444444-4444-4444-4444-444444444444',
        seller_id: 'f6a7b8c9-d0e1-2f3a-4b5c-6d7e8f9a0b1c',
        name: 'Traditional Wood-carved Jewelry Box',
        description: 'Solid rosewood chest with brass inlay motifs. Features red velvet compartments to protect rings and necklaces.',
        price: 29.00,
        stock: 12,
        image_url: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=600',
        category: 'Woodwork',
        tags: ['rosewood', 'brass inlay', 'jewelry box']
      }
    ];

    const { error: productError } = await supabase.from('products').insert(products);
    if (productError) throw productError;
    console.log('✅ Products seeded successfully!');

    console.log('✨ All seed data successfully injected into the database!');

  } catch (err) {
    console.error('❌ Error during seeding database:', err);
  }
}

seed();
