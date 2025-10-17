import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function setupAdmin() {
  console.log('🔧 Setting up admin user in Supabase Auth...');
  
  const email = 'admin@dfs-portal.com';
  const password = '12345678';
  
  try {
    // Try to sign up the admin user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: 'Admin',
          role: 'admin',
        },
      },
    });

    if (error) {
      if (error.message.includes('already registered')) {
        console.log('✅ Admin user already exists in Supabase Auth');
        console.log(`📧 Email: ${email}`);
        console.log(`🔑 Password: ${password}`);
        return;
      }
      throw error;
    }

    if (data.user) {
      console.log('✅ Admin user created successfully in Supabase Auth!');
      console.log(`📧 Email: ${email}`);
      console.log(`🔑 Password: ${password}`);
      console.log(`👤 User ID: ${data.user.id}`);
      
      if (data.session) {
        console.log('✅ User is automatically signed in');
      } else {
        console.log('⚠️  Email confirmation may be required. Check your Supabase Auth settings.');
      }
    }
  } catch (error) {
    console.error('❌ Failed to create admin user:', error.message);
    process.exit(1);
  }
}

setupAdmin();

