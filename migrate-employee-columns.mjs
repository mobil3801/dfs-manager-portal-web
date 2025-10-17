import postgres from 'postgres';

const sql = postgres('postgresql://postgres.fuhbzyvlojamohtjwhde:Dreamframe123%40Portal2025@aws-1-us-east-1.pooler.supabase.com:5432/postgres');

async function migrate() {
  try {
    console.log('Adding gas_station_ids column...');
    await sql`
      ALTER TABLE employees 
      ADD COLUMN IF NOT EXISTS gas_station_ids jsonb DEFAULT '[]'::jsonb
    `;
    
    console.log('Adding id_documents column...');
    await sql`
      ALTER TABLE employees 
      ADD COLUMN IF NOT EXISTS id_documents jsonb DEFAULT '[]'::jsonb
    `;
    
    console.log('Migrating existing gas_station_id to gas_station_ids...');
    await sql`
      UPDATE employees 
      SET gas_station_ids = jsonb_build_array(gas_station_id)
      WHERE gas_station_id IS NOT NULL AND (gas_station_ids IS NULL OR gas_station_ids = '[]'::jsonb)
    `;
    
    console.log('Migrating existing id_document to id_documents...');
    await sql`
      UPDATE employees 
      SET id_documents = jsonb_build_array(
        jsonb_build_object(
          'url', id_document_url,
          'type', COALESCE(id_document_type, 'Unknown')
        )
      )
      WHERE id_document_url IS NOT NULL AND (id_documents IS NULL OR id_documents = '[]'::jsonb)
    `;
    
    console.log('Verifying migration...');
    const result = await sql`
      SELECT 
        id, 
        first_name, 
        last_name, 
        gas_station_id, 
        gas_station_ids,
        id_document_url,
        id_document_type,
        id_documents
      FROM employees
      LIMIT 5
    `;
    
    console.log('Migration successful!');
    console.log('Sample records:', JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await sql.end();
  }
}

migrate();
