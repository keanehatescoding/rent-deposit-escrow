# Rent-deposit protection / escrow scheme

- **Concept:** A regulated third party holds tenant security deposits (instead of the landlord), tracks any deduction claims transparently, and pays out refunds quickly and fairly at the end of a tenancy.
- **Origin:** The UK's statutory tenancy deposit schemes (Tenancy Deposit Scheme, mydeposits, DPS) have been legally mandatory since 2007 and collectively hold billions of pounds.
- **Evidence of demand:** Kenyan sources confirm a real, well-documented problem: there is no legal cap on deposit size, no requirement for landlords to account for the money, and tenants routinely report losing most or all of their deposit to disputed "damage" claims; one Business Daily opinion piece describes it as "systemic theft" that "has never been criminalised."
- **Kenya landscape:** The Rent Restriction Act and Rent Tribunal exist but are reactive (you file a dispute after the fact), not preventive; no dedicated deposit-protection product was found.
- **Opportunity:** Real, painful, well-documented problem — but this is the hardest idea on the list to launch, honestly rated.
- **Target customers:** Property-management companies and estate agencies first (B2B2C), with individual landlords as a longer-term audience; marketed to tenants as a trust signal.
- **Revenue model:** A small fee per tenancy, or interest earned on pooled deposits (as UK insured schemes do), or a monthly SaaS fee to participating agencies.
- **Difficulty:** High — landlords have little direct incentive to opt in voluntarily (this is the two-sided "chicken-and-egg" problem the UK ultimately solved by making it a legal requirement); a credible bank or trust partner is likely needed to hold funds safely.
- **Scalability:** Medium — the underlying problem and regulatory path both differ by country.
- **Risks:** Adoption depends on landlord buy-in without a legal mandate; fund-safety and trust are existential to the business; may need to start as a value-add feature bundled into an existing property-management platform (like Nyumbani) rather than a standalone company.
- **MVP:** Pilot with a handful of property-management companies as an opt-in add-on, holding deposits in a dedicated account with a partner bank.

---

Source: `PROJECTS.md` (Online Business Models: Proven Abroad, Underdeveloped in Kenya).


---

## Stack & dev

Scaffolded as a Next.js 16 + Drizzle (Postgres) app, matching the stack used in `odpc-compliance-saas`. The schema in `src/db/schema.ts` is the current source of truth for the data model; UI, auth and payment integrations are not yet wired up.

```
npm install
# point .env at a Postgres instance, see .env.example
npm run db:generate   # drizzle-kit: emit SQL migrations from the schema
npm run db:migrate    # apply them (migrator script not yet included — copy from odpc-compliance-saas)
npm run dev           # Next.js dev server on :3000
```

What is here:
- `src/db/schema.ts` — Drizzle Postgres schema specific to this domain
- `src/db/index.ts` — pooled `pg` + Drizzle client
- `drizzle.config.ts`, `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `postcss.config.mjs`
- `src/app/globals.css`, `.gitignore`, `.env.example`

What is still a stub:
- `src/app/layout.tsx` + `src/app/page.tsx` — scaffold against the installed Next version (see `node_modules/next/dist/docs/`); the `odpc-compliance-saas` siblings are a working reference.
- Auth (sessions, password reset, email verify) — copy and adapt the `lib/session.ts`, `lib/password.ts`, `lib/email-verification.ts` set from `odpc-compliance-saas`.
- Payments (M-Pesa Daraja / Paystack / card) — stack-specific, add per project.
- `scripts/migrate.ts`, `scripts/seed.ts` — not yet included; the `package.json` scripts expect them.
