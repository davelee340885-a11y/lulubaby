import { db } from '../server/db';
import { users } from '../drizzle/schema';

async function main() {
  const rows = await db.select({ id: users.id, name: users.name, subdomain: users.subdomain }).from(users);
  console.log(JSON.stringify(rows, null, 2));
  process.exit(0);
}

main();
