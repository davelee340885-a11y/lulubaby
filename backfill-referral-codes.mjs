/**
 * Backfill script: Generate referral codes for existing users who don't have one.
 * Run: node backfill-referral-codes.mjs
 */
import mysql from 'mysql2/promise';
import { customAlphabet } from 'nanoid';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const generate = customAlphabet(ALPHABET, 6);
const generateReferralCode = () => `LULU-${generate()}`;

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }

  const connection = await mysql.createConnection(url);

  // Find users without referral codes
  const [rows] = await connection.execute(
    'SELECT id, name FROM users WHERE referralCode IS NULL OR referralCode = ""'
  );

  console.log(`Found ${rows.length} users without referral codes`);

  let updated = 0;
  for (const user of rows) {
    let code;
    let attempts = 0;
    while (attempts < 10) {
      code = generateReferralCode();
      const [existing] = await connection.execute(
        'SELECT id FROM users WHERE referralCode = ?',
        [code]
      );
      if (existing.length === 0) break;
      attempts++;
    }

    if (code) {
      await connection.execute(
        'UPDATE users SET referralCode = ? WHERE id = ?',
        [code, user.id]
      );
      console.log(`  User #${user.id} (${user.name}) → ${code}`);
      updated++;
    }
  }

  console.log(`\nDone! Updated ${updated} users with referral codes.`);
  await connection.end();
}

main().catch(console.error);
