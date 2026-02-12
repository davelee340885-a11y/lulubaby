import { getDb } from '../server/db';
import { users } from '../drizzle/schema';
import { eq, isNull } from 'drizzle-orm';
import { generateRandomSubdomain, isSubdomainAvailable } from '../server/db';

async function main() {
  const db = await getDb();
  if (!db) {
    console.error('Database not available');
    process.exit(1);
  }

  // Get all users without subdomain
  const usersWithoutSubdomain = await db.select({ id: users.id, name: users.name })
    .from(users)
    .where(isNull(users.subdomain));

  console.log(`Found ${usersWithoutSubdomain.length} users without subdomain`);

  for (const user of usersWithoutSubdomain) {
    let subdomain: string | null = null;
    for (let attempt = 0; attempt < 10; attempt++) {
      const candidate = generateRandomSubdomain();
      const available = await isSubdomainAvailable(candidate);
      if (available) {
        subdomain = candidate;
        break;
      }
    }

    if (subdomain) {
      await db.update(users).set({ subdomain }).where(eq(users.id, user.id));
      console.log(`Assigned ${subdomain}.lulubaby.xyz to user ${user.id} (${user.name})`);
    } else {
      console.error(`Failed to generate subdomain for user ${user.id}`);
    }
  }

  console.log('Done!');
  process.exit(0);
}

main();
