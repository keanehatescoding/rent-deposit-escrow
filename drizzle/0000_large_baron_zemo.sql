CREATE TYPE "public"."deposit_status" AS ENUM('awaiting_funds', 'held', 'release_pending', 'released', 'disputed', 'forfeited');--> statement-breakpoint
CREATE TYPE "public"."dispute_status" AS ENUM('opened', 'evidence_requested', 'under_review', 'resolved', 'withdrawn');--> statement-breakpoint
CREATE TYPE "public"."party" AS ENUM('tenant', 'landlord');--> statement-breakpoint
CREATE TYPE "public"."tenancy_status" AS ENUM('pending_deposit', 'active', 'notice_given', 'ended');--> statement-breakpoint
CREATE TYPE "public"."transfer_status" AS ENUM('pending', 'succeeded', 'failed');--> statement-breakpoint
CREATE TABLE "deposit_fundings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"deposit_id" uuid NOT NULL,
	"status" "transfer_status" DEFAULT 'pending' NOT NULL,
	"amount_kes" integer NOT NULL,
	"channel" text DEFAULT 'mpesa' NOT NULL,
	"external_ref" text,
	"received_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "deposits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenancy_id" uuid NOT NULL,
	"status" "deposit_status" DEFAULT 'awaiting_funds' NOT NULL,
	"amount_kes" integer NOT NULL,
	"accrued_interest_kes" integer DEFAULT 0 NOT NULL,
	"held_since" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "disputes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"release_request_id" uuid NOT NULL,
	"opened_by" "party" NOT NULL,
	"status" "dispute_status" DEFAULT 'opened' NOT NULL,
	"tenant_position" text DEFAULT '' NOT NULL,
	"landlord_position" text DEFAULT '' NOT NULL,
	"adjudicator_notes" text DEFAULT '' NOT NULL,
	"final_to_tenant_kes" integer,
	"final_to_landlord_kes" integer,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inspections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenancy_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"performed_at" timestamp with time zone NOT NULL,
	"conducted_by" text NOT NULL,
	"photo_urls" text[] DEFAULT '{}'::text[] NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"tenant_signed" boolean DEFAULT false NOT NULL,
	"landlord_signed" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payouts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"deposit_id" uuid NOT NULL,
	"to_user_id" uuid NOT NULL,
	"status" "transfer_status" DEFAULT 'pending' NOT NULL,
	"amount_kes" integer NOT NULL,
	"channel" text DEFAULT 'mpesa' NOT NULL,
	"external_ref" text,
	"paid_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "properties" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"landlord_id" uuid NOT NULL,
	"label" text NOT NULL,
	"address_line" text NOT NULL,
	"neighbourhood" text NOT NULL,
	"town" text DEFAULT 'Nairobi' NOT NULL,
	"unit_type" text DEFAULT 'bedsitter' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "release_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"deposit_id" uuid NOT NULL,
	"requested_by" "party" NOT NULL,
	"to_tenant_kes" integer NOT NULL,
	"to_landlord_kes" integer NOT NULL,
	"deductions_breakdown" text DEFAULT '' NOT NULL,
	"counterparty_responded_at" timestamp with time zone,
	"counterparty_agrees" boolean,
	"executed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenancies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"status" "tenancy_status" DEFAULT 'pending_deposit' NOT NULL,
	"monthly_rent_kes" integer NOT NULL,
	"deposit_kes" integer NOT NULL,
	"starts_on" date NOT NULL,
	"ends_on" date,
	"notice_days" integer DEFAULT 30 NOT NULL,
	"lease_pdf_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"phone" text,
	"national_id" text,
	"password_hash" text NOT NULL,
	"email_verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "deposit_fundings" ADD CONSTRAINT "deposit_fundings_deposit_id_deposits_id_fk" FOREIGN KEY ("deposit_id") REFERENCES "public"."deposits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deposits" ADD CONSTRAINT "deposits_tenancy_id_tenancies_id_fk" FOREIGN KEY ("tenancy_id") REFERENCES "public"."tenancies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_release_request_id_release_requests_id_fk" FOREIGN KEY ("release_request_id") REFERENCES "public"."release_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inspections" ADD CONSTRAINT "inspections_tenancy_id_tenancies_id_fk" FOREIGN KEY ("tenancy_id") REFERENCES "public"."tenancies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_deposit_id_deposits_id_fk" FOREIGN KEY ("deposit_id") REFERENCES "public"."deposits"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_to_user_id_users_id_fk" FOREIGN KEY ("to_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "properties" ADD CONSTRAINT "properties_landlord_id_users_id_fk" FOREIGN KEY ("landlord_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "release_requests" ADD CONSTRAINT "release_requests_deposit_id_deposits_id_fk" FOREIGN KEY ("deposit_id") REFERENCES "public"."deposits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenancies" ADD CONSTRAINT "tenancies_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenancies" ADD CONSTRAINT "tenancies_tenant_id_users_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "deposit_fundings_deposit_idx" ON "deposit_fundings" USING btree ("deposit_id");--> statement-breakpoint
CREATE UNIQUE INDEX "deposits_tenancy_idx" ON "deposits" USING btree ("tenancy_id");--> statement-breakpoint
CREATE INDEX "disputes_release_idx" ON "disputes" USING btree ("release_request_id");--> statement-breakpoint
CREATE INDEX "inspections_tenancy_idx" ON "inspections" USING btree ("tenancy_id");--> statement-breakpoint
CREATE INDEX "payouts_deposit_idx" ON "payouts" USING btree ("deposit_id");--> statement-breakpoint
CREATE INDEX "properties_landlord_idx" ON "properties" USING btree ("landlord_id");--> statement-breakpoint
CREATE INDEX "release_requests_deposit_idx" ON "release_requests" USING btree ("deposit_id");--> statement-breakpoint
CREATE INDEX "sessions_user_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "tenancies_tenant_idx" ON "tenancies" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "tenancies_property_idx" ON "tenancies" USING btree ("property_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_lower_idx" ON "users" USING btree (lower("email"));