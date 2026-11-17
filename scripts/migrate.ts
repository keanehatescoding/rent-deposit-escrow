import { migrate } from "drizzle-orm/node-postgres/migrator";
import { existsSync } from "fs";
import { pgDb, getPool } from "../src/db/index";

async function main(): Promise<void> {
  const migrationsFolder = "./drizzle";

  if (!existsSync(migrationsFolder)) {
    throw new Error(
      `No "${migrationsFolder}" directory found. Run "npm run db:generate" to emit SQL migrations from src/db/schema.ts, then run "npm run db:migrate" again.`,
    );
  }

  console.log(`Applying SQL migrations from "${migrationsFolder}"...`);
  await migrate(pgDb, { migrationsFolder });
  console.log("Migrations applied successfully.");

  await getPool().end();
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.stack ?? error.message : String(error));
  process.exit(1);
});
