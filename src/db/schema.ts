import { relations, sql } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const tenancyStatusEnum = pgEnum("tenancy_status", ["pending_deposit", "active", "notice_given", "ended"]);
export const depositStatusEnum = pgEnum("deposit_status", [
  "awaiting_funds",
  "held",
  "release_pending",
  "released",
  "disputed",
  "forfeited",
]);
export const partyEnum = pgEnum("party", ["tenant", "landlord"]);
export const disputeStatusEnum = pgEnum("dispute_status", [
  "opened",
  "evidence_requested",
  "under_review",
  "resolved",
  "withdrawn",
]);
export const transferStatusEnum = pgEnum("transfer_status", ["pending", "succeeded", "failed"]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    name: text("name").notNull(),
    phone: text("phone"),
    nationalId: text("national_id"),
    passwordHash: text("password_hash").notNull(),
    emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [uniqueIndex("users_email_lower_idx").on(sql`lower(${t.email})`)],
);

export const sessions = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

export const properties = pgTable(
  "properties",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    landlordId: uuid("landlord_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    addressLine: text("address_line").notNull(),
    neighbourhood: text("neighbourhood").notNull(),
    town: text("town").notNull().default("Nairobi"),
    unitType: text("unit_type").notNull().default("bedsitter"),
    ...timestamps,
  },
  (t) => [index("properties_landlord_idx").on(t.landlordId)],
);

export const tenancies = pgTable(
  "tenancies",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    propertyId: uuid("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "restrict" }),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    status: tenancyStatusEnum("status").notNull().default("pending_deposit"),
    monthlyRentKes: integer("monthly_rent_kes").notNull(),
    depositKes: integer("deposit_kes").notNull(),
    startsOn: date("starts_on", { mode: "string" }).notNull(),
    endsOn: date("ends_on", { mode: "string" }),
    noticeDays: integer("notice_days").notNull().default(30),
    leasePdfUrl: text("lease_pdf_url"),
    ...timestamps,
  },
  (t) => [
    index("tenancies_tenant_idx").on(t.tenantId),
    index("tenancies_property_idx").on(t.propertyId),
  ],
);

/** The money held on behalf of both parties. One deposit per tenancy. */
export const deposits = pgTable(
  "deposits",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenancyId: uuid("tenancy_id")
      .notNull()
      .references(() => tenancies.id, { onDelete: "cascade" }),
    status: depositStatusEnum("status").notNull().default("awaiting_funds"),
    amountKes: integer("amount_kes").notNull(),
    // Interest accrues at a published rate; principal + interest is released at the end.
    accruedInterestKes: integer("accrued_interest_kes").notNull().default(0),
    heldSince: timestamp("held_since", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [uniqueIndex("deposits_tenancy_idx").on(t.tenancyId)],
);

/** M-Pesa or bank transfer in to the escrow. */
export const depositFundings = pgTable(
  "deposit_fundings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    depositId: uuid("deposit_id")
      .notNull()
      .references(() => deposits.id, { onDelete: "cascade" }),
    status: transferStatusEnum("status").notNull().default("pending"),
    amountKes: integer("amount_kes").notNull(),
    channel: text("channel").notNull().default("mpesa"),
    externalRef: text("external_ref"),
    receivedAt: timestamp("received_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [index("deposit_fundings_deposit_idx").on(t.depositId)],
);

/** Pre-move-in and move-out walkthroughs form the evidence base when a dispute arises. */
export const inspections = pgTable(
  "inspections",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenancyId: uuid("tenancy_id")
      .notNull()
      .references(() => tenancies.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(),
    performedAt: timestamp("performed_at", { withTimezone: true }).notNull(),
    conductedBy: text("conducted_by").notNull(),
    photoUrls: text("photo_urls").array().notNull().default(sql`'{}'::text[]`),
    notes: text("notes").notNull().default(""),
    tenantSigned: boolean("tenant_signed").notNull().default(false),
    landlordSigned: boolean("landlord_signed").notNull().default(false),
  },
  (t) => [index("inspections_tenancy_idx").on(t.tenancyId)],
);

/** The agreed split at end-of-tenancy. May become a dispute if the counterparty objects. */
export const releaseRequests = pgTable(
  "release_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    depositId: uuid("deposit_id")
      .notNull()
      .references(() => deposits.id, { onDelete: "cascade" }),
    requestedBy: partyEnum("requested_by").notNull(),
    toTenantKes: integer("to_tenant_kes").notNull(),
    toLandlordKes: integer("to_landlord_kes").notNull(),
    deductionsBreakdown: text("deductions_breakdown").notNull().default(""),
    counterpartyRespondedAt: timestamp("counterparty_responded_at", { withTimezone: true }),
    counterpartyAgrees: boolean("counterparty_agrees"),
    executedAt: timestamp("executed_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [index("release_requests_deposit_idx").on(t.depositId)],
);

export const disputes = pgTable(
  "disputes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    releaseRequestId: uuid("release_request_id")
      .notNull()
      .references(() => releaseRequests.id, { onDelete: "cascade" }),
    openedBy: partyEnum("opened_by").notNull(),
    status: disputeStatusEnum("status").notNull().default("opened"),
    tenantPosition: text("tenant_position").notNull().default(""),
    landlordPosition: text("landlord_position").notNull().default(""),
    adjudicatorNotes: text("adjudicator_notes").notNull().default(""),
    finalToTenantKes: integer("final_to_tenant_kes"),
    finalToLandlordKes: integer("final_to_landlord_kes"),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [index("disputes_release_idx").on(t.releaseRequestId)],
);

/** Money going out of escrow — once a release is executed. */
export const payouts = pgTable(
  "payouts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    depositId: uuid("deposit_id")
      .notNull()
      .references(() => deposits.id, { onDelete: "restrict" }),
    toUserId: uuid("to_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    status: transferStatusEnum("status").notNull().default("pending"),
    amountKes: integer("amount_kes").notNull(),
    channel: text("channel").notNull().default("mpesa"),
    externalRef: text("external_ref"),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [index("payouts_deposit_idx").on(t.depositId)],
);

export const tenancyRelations = relations(tenancies, ({ one, many }) => ({
  property: one(properties, { fields: [tenancies.propertyId], references: [properties.id] }),
  tenant: one(users, { fields: [tenancies.tenantId], references: [users.id] }),
  deposit: one(deposits, { fields: [tenancies.id], references: [deposits.tenancyId] }),
  inspections: many(inspections),
}));

export const depositRelations = relations(deposits, ({ one, many }) => ({
  tenancy: one(tenancies, { fields: [deposits.tenancyId], references: [tenancies.id] }),
  fundings: many(depositFundings),
  releases: many(releaseRequests),
  payouts: many(payouts),
}));

export type Property = typeof properties.$inferSelect;
export type Tenancy = typeof tenancies.$inferSelect;
export type Deposit = typeof deposits.$inferSelect;
export type ReleaseRequest = typeof releaseRequests.$inferSelect;
export type Dispute = typeof disputes.$inferSelect;
export type Payout = typeof payouts.$inferSelect;
