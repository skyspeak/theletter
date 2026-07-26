import { config as loadEnv } from "dotenv";
import { defineConfig } from "prisma/config";

// Prefer .env.local (Vite-style) over .env for local Prisma CLI.
loadEnv({ path: ".env.local" });
loadEnv(); // .env fills any gaps; does not override existing keys

const databaseUrl = (process.env.DATABASE_URL ?? "").replace(/\\n$/, "");

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: databaseUrl,
  },
  migrations: {
    path: "prisma/migrations",
  },
});
