import { defineConfig } from "drizzle-kit";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required to run drizzle commands");
}

// Parse the connection string and add SSL config for TiDB Cloud
const url = new URL(connectionString);
const host = url.hostname;
const port = url.port || "4000";
const user = url.username;
const password = url.password;
const database = url.pathname.slice(1);

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle",
  dialect: "mysql",
  dbCredentials: {
    host,
    port: parseInt(port),
    user,
    password,
    database,
    ssl: {
      rejectUnauthorized: true,
    },
  },
});
