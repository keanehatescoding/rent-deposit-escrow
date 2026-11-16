import { eq } from "drizzle-orm";
import { users, properties, tenancies, deposits } from "../src/db/schema";
import { db, getPool } from "../src/db/index";

const DEMO = {
  landlord: {
    email: "landlord@example.com",
    name: "Demo Landlord",
    phone: "+254700000001",
    passwordHash: "$2b$10$demo.placeholder.do.not.use.for.auth",
  },
  tenant: {
    email: "tenant@example.com",
    name: "Demo Tenant",
    phone: "+254700000002",
    passwordHash: "$2b$10$demo.placeholder.do.not.use.for.auth",
  },
  property: {
    label: "Kilimani Garden Flat - Unit 3B",
    addressLine: "Argwings Kodhek Road",
    neighbourhood: "Kilimani",
    town: "Nairobi",
    unitType: "2-bedroom apartment",
  },
  tenancy: {
    monthlyRentKes: 45000,
    depositKes: 90000,
    noticeDays: 30,
  },
  startsOn: "2026-01-05",
};

async function main(): Promise<void> {
  if (process.env.SEED_DEMO !== "1") {
    console.log(
      "Demo seed skipped. Set SEED_DEMO=1 to insert a demo landlord, tenant, property, tenancy and deposit.",
    );
    await getPool().end();
    return;
  }

  console.log("Seeding demo data (SEED_DEMO=1)...");

  let landlord = await db.query.users.findFirst({ where: eq(users.email, DEMO.landlord.email) });
  if (!landlord) {
    const [row] = await db.insert(users).values(DEMO.landlord).returning();
    landlord = row;
  }

  let tenant = await db.query.users.findFirst({ where: eq(users.email, DEMO.tenant.email) });
  if (!tenant) {
    const [row] = await db.insert(users).values(DEMO.tenant).returning();
    tenant = row;
  }

  const [property] = await db
    .insert(properties)
    .values({ ...DEMO.property, landlordId: landlord.id })
    .returning();

  let tenancy = await db.query.tenancies.findFirst({ where: eq(tenancies.propertyId, property.id) });
  if (!tenancy) {
    const [row] = await db
      .insert(tenancies)
      .values({ propertyId: property.id, tenantId: tenant.id, ...DEMO.tenancy, startsOn: DEMO.startsOn })
      .returning();
    tenancy = row;
  }

  const existingDeposit = await db.query.deposits.findFirst({ where: eq(deposits.tenancyId, tenancy.id) });
  if (!existingDeposit) {
    await db.insert(deposits).values({ tenancyId: tenancy.id, amountKes: DEMO.tenancy.depositKes });
    console.log("Deposit created.");
  }

  console.log("Demo seed complete.");
  await getPool().end();
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.stack ?? error.message : String(error));
  process.exit(1);
});
