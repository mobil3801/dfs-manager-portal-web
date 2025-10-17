import postgres from 'postgres';

const sql = postgres('postgresql://postgres.fuhbzyvlojamohtjwhde:Dreamframe123@Portal2025@aws-1-us-east-1.pooler.supabase.com:5432/postgres');

try {
  const columns = await sql`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'users' 
    AND table_schema = 'public'
    ORDER BY ordinal_position;
  `;
  
  console.log('Columns in users table:');
  columns.forEach(c => {
    console.log(`  - ${c.column_name} (${c.data_type})`);
  });
  
} catch (error) {
  console.error('Error:', error.message);
} finally {
  await sql.end();
}
