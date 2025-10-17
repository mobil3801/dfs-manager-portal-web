import postgres from 'postgres';

const sql = postgres('postgresql://postgres.fuhbzyvlojamohtjwhde:Dreamframe123@Portal2025@aws-1-us-east-1.pooler.supabase.com:5432/postgres');

try {
  console.log('Checking database tables...\n');
  
  const tables = await sql`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `;
  
  console.log('Tables in public schema:');
  tables.forEach(t => console.log('  -', t.table_name));
  
  console.log('\nChecking enum types...\n');
  
  const enums = await sql`
    SELECT typname 
    FROM pg_type 
    WHERE typtype = 'e' 
    ORDER BY typname;
  `;
  
  console.log('Enum types:');
  enums.forEach(e => console.log('  -', e.typname));
  
} catch (error) {
  console.error('Error:', error.message);
} finally {
  await sql.end();
}
