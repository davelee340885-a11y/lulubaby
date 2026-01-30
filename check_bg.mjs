import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

try {
  const [rows] = await connection.execute(
    'SELECT id, backgroundColor, backgroundType, immersiveMode FROM ai_personas WHERE id = 1'
  );
  console.log(JSON.stringify(rows, null, 2));
} finally {
  await connection.end();
}
