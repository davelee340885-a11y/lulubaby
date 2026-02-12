import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { aiPersonas } from './drizzle/schema.ts';
import { eq } from 'drizzle-orm';

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

// Query using Drizzle ORM
const result = await db.select().from(aiPersonas).where(eq(aiPersonas.userId, 1)).limit(1);

console.log('Drizzle ORM result:');
console.log('welcomeMessageColor:', result[0]?.welcomeMessageColor);
console.log('welcomeMessageSize:', result[0]?.welcomeMessageSize);

// Also query using raw SQL
const [rows] = await connection.execute('SELECT welcomeMessageColor, welcomeMessageSize FROM ai_personas WHERE userId = 1');
console.log('\nRaw SQL result:');
console.log(rows);

await connection.end();
