import path from "node:path";
import { defineConfig } from "prisma/config";
import * as dotenv from "dotenv";

dotenv.config();

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
  migrate: {
    async adapter() {
      const { PrismaPg } = await import("@prisma/adapter-pg");
      const connectionString = process.env.DATABASE_URL!;
      return new PrismaPg({ connectionString });
    },
  },
  datasource: {
    url: process.env.DATABASE_URL!,
  },
});
