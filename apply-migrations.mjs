import { drizzle } from 'drizzle-orm/mysql2';
import { readFileSync } from 'fs';

const db = drizzle(process.env.DATABASE_URL);

async function applyMigrations() {
  try {
    const migration = readFileSync('./drizzle/0000_certain_galactus.sql', 'utf-8');
    const statements = migration
      .split('--> statement-breakpoint')
      .map(s => s.trim())
      .filter(Boolean)
      .filter(s => !s.includes('CREATE TABLE `users`')); // Skip users table as it already exists
    
    console.log(`Applying ${statements.length} migration statements...`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement) {
        console.log(`[${i + 1}/${statements.length}] Executing: ${statement.substring(0, 50)}...`);
        try {
          await db.execute(statement);
        } catch (error) {
          console.error(`Failed to execute statement ${i + 1}:`, error.message);
          if (!error.message.includes('already exists')) {
            throw error;
          }
        }
      }
    }
    
    console.log('✓ All migrations applied successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

applyMigrations();

