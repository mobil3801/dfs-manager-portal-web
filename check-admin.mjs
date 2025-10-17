import postgres from 'postgres';

const sql = postgres('postgresql://postgres.fuhbzyvlojamohtjwhde:Dreamframe123@Portal2025@aws-1-us-east-1.pooler.supabase.com:5432/postgres');

try {
  const users = await sql`
    SELECT id, email, role, "createdAt" 
    FROM users 
    ORDER BY "createdAt";
  `;
  
  console.log(`Found ${users.length} user(s) in database:\n`);
  users.forEach(u => {
    console.log(`  - ${u.email} (${u.role}) - Created: ${u.createdAt}`);
  });
  
  if (users.length === 0) {
    console.log('\nNo users found. Admin account needs to be created.');
  }
  
} catch (error) {
  console.error('Error:', error.message);
} finally {
  await sql.end();
}
