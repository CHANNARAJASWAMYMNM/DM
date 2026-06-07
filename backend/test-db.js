const supabase = require('./config/supabase');
const bcrypt = require('bcryptjs');

async function testConnection() {
  console.log('🔍 Testing connection to Supabase...');
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, role, name, password_hash');
    
    if (error) {
      console.error('❌ Supabase Query Error:', error);
      return;
    }

    console.log(`✅ Success! Found ${users.length} users in the database:\n`);
    for (const u of users) {
      console.log(`- Name: ${u.name}`);
      console.log(`  Email: ${u.email}`);
      console.log(`  Role: ${u.role}`);
      
      // Test password hash against 'password123'
      const matches = await bcrypt.compare('password123', u.password_hash);
      console.log(`  Password 'password123' matches?: ${matches ? 'Yes' : 'No'}`);
      console.log(`  Hash: ${u.password_hash}\n`);
    }

  } catch (err) {
    console.error('❌ Connection script error:', err);
  }
}

testConnection();
