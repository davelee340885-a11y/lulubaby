import { getDb } from '../server/_core/db';
import { users, personas } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

async function main() {
  const db = getDb();
  const u = await db.select({ id: users.id, email: users.email, name: users.name }).from(users).where(eq(users.email, 'davelee340885@gmail.com'));
  console.log('User:', u);
  if (u.length > 0) {
    const p = await db.select({ id: personas.id, agentName: personas.agentName, userId: personas.userId }).from(personas).where(eq(personas.userId, u[0].id));
    console.log('Personas:', p);
  }
  process.exit(0);
}
main();
