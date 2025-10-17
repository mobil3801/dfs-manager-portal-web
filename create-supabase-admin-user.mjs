import { createClient } from '@supabase/supabase-js';

// Supabase credentials
const supabaseUrl = 'https://fuhbzyvlojamohtjwhde.supabase.co';
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1aGJ6eXZsb2phbW9odGp3aGRlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDY3ODgwOSwiZXhwIjoyMDc2MjU0ODA5fQ.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1aGJ6eXZsb2phbW9odGp3aGRlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDY3ODgwOSwiZXhwIjoyMDc2MjU0ODA5fQ';

// Create admin client
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createAdminUser() {
  try {
    console.log('Creating admin user in Supabase Auth...');
    
    // Create user with admin@dfs-portal.com
    const { data, error } = await supabase.auth.admin.createUser({
      email: 'admin@dfs-portal.com',
      password: '12345678',
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        name: 'Admin User',
        role: 'admin'
      }
    });

    if (error) {
      console.error('Error creating user:', error);
      return;
    }

    console.log('✅ Admin user created successfully!');
    console.log('User ID:', data.user.id);
    console.log('Email:', data.user.email);
    console.log('\nLogin credentials:');
    console.log('Email: admin@dfs-portal.com');
    console.log('Password: 12345678');
    console.log('\n⚠️  Please change the password after first login!');

    // Also create a record in the users table
    console.log('\nCreating user record in database...');
    const { error: dbError } = await supabase
      .from('users')
      .insert({
        id: data.user.id,
        email: data.user.email,
        name: 'Admin User',
        role: 'admin'
      });

    if (dbError) {
      console.error('Error creating user record in database:', dbError);
    } else {
      console.log('✅ User record created in database!');
    }

  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

createAdminUser();

