import postgres from 'postgres';
import bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

const sql = postgres('postgresql://postgres.fuhbzyvlojamohtjwhde:Dreamframe123@Portal2025@aws-1-us-east-1.pooler.supabase.com:5432/postgres');

async function createAdmin() {
  try {
    // Check if admin already exists
    const existing = await sql`
      SELECT email FROM users WHERE email = 'admin@dfs-portal.com'
    `;
    
    if (existing.length > 0) {
      console.log('✅ Admin account already exists: admin@dfs-portal.com');
      return;
    }
    
    // Hash the password
    const hashedPassword = await bcrypt.hash('12345678', 10);
    
    // Generate a unique ID
    const id = randomBytes(16).toString('hex');
    
    // Create admin user
    await sql`
      INSERT INTO users (id, email, password, "loginMethod", role, name)
      VALUES (${id}, 'admin@dfs-portal.com', ${hashedPassword}, 'email', 'admin', 'Admin User')
    `;
    
    console.log('✅ Admin account created successfully!');
    console.log('   Email: admin@dfs-portal.com');
    console.log('   Password: 12345678');
    console.log('   Role: admin');
    
  } catch (error) {
    console.error('❌ Error creating admin account:', error.message);
    throw error;
  } finally {
    await sql.end();
  }
}

createAdmin();
