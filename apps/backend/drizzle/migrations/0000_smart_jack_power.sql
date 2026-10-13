CREATE TABLE "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"username" varchar(64) NOT NULL,
	"password_hash" text NOT NULL,
	"full_name" varchar(128),
	"is_active" boolean DEFAULT true NOT NULL,
	"totp_secret_encrypted" text,
	"totp_enabled" boolean DEFAULT false NOT NULL,
	"failed_login_attempts" integer DEFAULT 0 NOT NULL,
	"locked_until" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "permissions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" varchar(64) NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "permissions_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "role_permissions" (
	"role_id" uuid NOT NULL,
	"permission_id" uuid NOT NULL,
	CONSTRAINT "role_permissions_role_id_permission_id_pk" PRIMARY KEY("role_id","permission_id")
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" varchar(64) NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "roles_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "user_roles" (
	"user_id" uuid NOT NULL,
	"role_id" uuid NOT NULL,
	CONSTRAINT "user_roles_user_id_role_id_pk" PRIMARY KEY("user_id","role_id")
);
--> statement-breakpoint
CREATE TABLE "api_keys" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(64) NOT NULL,
	"prefix" varchar(16) NOT NULL,
	"key_hash" text NOT NULL,
	"is_revoked" boolean DEFAULT false NOT NULL,
	"expires_at" timestamp with time zone,
	"last_used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"refresh_token_hash" text NOT NULL,
	"ip_address" varchar(45),
	"user_agent" text,
	"is_revoked" boolean DEFAULT false NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "broker_accounts" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"broker_type" varchar(32) NOT NULL,
	"account_name" varchar(128) NOT NULL,
	"customer_title" varchar(128),
	"customer_code" varchar(64),
	"customer_id" varchar(64),
	"auth_type" varchar(32) DEFAULT 'BEARER_JWT' NOT NULL,
	"encrypted_credentials" text NOT NULL,
	"key_version" integer DEFAULT 1 NOT NULL,
	"token_expires_at" timestamp with time zone,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "bot_configs" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"broker_account_id" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"symbol" varchar(32) NOT NULL,
	"isin" varchar(32),
	"price_rials" bigint NOT NULL,
	"quantity" integer NOT NULL,
	"side" varchar(8) DEFAULT 'BUY' NOT NULL,
	"broker_type" varchar(32) DEFAULT 'custom' NOT NULL,
	"anti_double_spend" boolean DEFAULT true NOT NULL,
	"target_url" text NOT NULL,
	"http_method" varchar(8) DEFAULT 'POST' NOT NULL,
	"headers_template" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"body_template" text NOT NULL,
	"max_sockets" integer DEFAULT 10 NOT NULL,
	"timeout_ms" integer DEFAULT 3000 NOT NULL,
	"target_time" varchar(16) DEFAULT '08:45:00.000' NOT NULL,
	"lead_time_ms" double precision DEFAULT 22 NOT NULL,
	"burst_count" integer DEFAULT 6 NOT NULL,
	"burst_interval_ms" double precision DEFAULT 3.5 NOT NULL,
	"pre_warm_seconds" integer DEFAULT 15 NOT NULL,
	"stop_on_first_success" boolean DEFAULT true NOT NULL,
	"ntp_sync_interval_ms" integer DEFAULT 60000 NOT NULL,
	"sound_alert_enabled" boolean DEFAULT true NOT NULL,
	"auto_open_browser" boolean DEFAULT false NOT NULL,
	"ntp_servers" jsonb DEFAULT '["ir.pool.ntp.org","time.google.com","pool.ntp.org"]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_attempts" (
	"id" uuid PRIMARY KEY NOT NULL,
	"order_id" uuid NOT NULL,
	"shot_index" integer NOT NULL,
	"scheduled_time" timestamp with time zone NOT NULL,
	"fired_at" timestamp with time zone NOT NULL,
	"response_at" timestamp with time zone NOT NULL,
	"latency_ms" double precision NOT NULL,
	"http_status" integer NOT NULL,
	"is_success" boolean NOT NULL,
	"broker_tracking_code" varchar(64),
	"queue_rank" integer,
	"error_message" text,
	"raw_request_headers" jsonb,
	"raw_request_payload" text,
	"raw_response_payload" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY NOT NULL,
	"bot_config_id" uuid,
	"user_id" uuid NOT NULL,
	"idempotency_key" varchar(128) NOT NULL,
	"symbol" varchar(32) NOT NULL,
	"isin" varchar(32),
	"side" varchar(8) NOT NULL,
	"price_rials" bigint NOT NULL,
	"quantity" integer NOT NULL,
	"order_value_rials" bigint NOT NULL,
	"status" varchar(32) DEFAULT 'PENDING' NOT NULL,
	"scheduled_target_time" timestamp with time zone NOT NULL,
	"fired_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"successful_shot_index" integer,
	"broker_tracking_code" varchar(64),
	"total_attempts" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orders_idempotency_key_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "symbols" (
	"isin" varchar(32) PRIMARY KEY NOT NULL,
	"symbol" varchar(32) NOT NULL,
	"name" varchar(128) NOT NULL,
	"ins_code" varchar(32),
	"market" varchar(64),
	"group_name" varchar(64),
	"base_price" bigint,
	"closing_price" bigint,
	"yesterday_price" bigint,
	"p_max" bigint,
	"p_min" bigint,
	"base_volume" bigint,
	"volume" bigint,
	"value" bigint,
	"trades_count" integer,
	"eps" integer,
	"pe" numeric(8, 2),
	"is_ipo" boolean DEFAULT false NOT NULL,
	"ipo_details" jsonb,
	"last_synced_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "symbols_symbol_unique" UNIQUE("symbol")
);
--> statement-breakpoint
CREATE TABLE "watchlists" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"symbol" varchar(32) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid,
	"action" varchar(64) NOT NULL,
	"entity_type" varchar(32),
	"entity_id" varchar(64),
	"ip_address" varchar(45),
	"user_agent" text,
	"details" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"type" varchar(32) NOT NULL,
	"title" varchar(128) NOT NULL,
	"message" text NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "broker_accounts" ADD CONSTRAINT "broker_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bot_configs" ADD CONSTRAINT "bot_configs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bot_configs" ADD CONSTRAINT "bot_configs_broker_account_id_broker_accounts_id_fk" FOREIGN KEY ("broker_account_id") REFERENCES "public"."broker_accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_attempts" ADD CONSTRAINT "order_attempts_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_bot_config_id_bot_configs_id_fk" FOREIGN KEY ("bot_config_id") REFERENCES "public"."bot_configs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watchlists" ADD CONSTRAINT "watchlists_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "users_username_idx" ON "users" USING btree ("username");--> statement-breakpoint
CREATE INDEX "users_is_active_idx" ON "users" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "permissions_name_idx" ON "permissions" USING btree ("name");--> statement-breakpoint
CREATE INDEX "role_permissions_role_idx" ON "role_permissions" USING btree ("role_id");--> statement-breakpoint
CREATE INDEX "roles_name_idx" ON "roles" USING btree ("name");--> statement-breakpoint
CREATE INDEX "user_roles_user_idx" ON "user_roles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "api_keys_user_id_idx" ON "api_keys" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "api_keys_key_hash_idx" ON "api_keys" USING btree ("key_hash");--> statement-breakpoint
CREATE INDEX "sessions_user_id_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_token_hash_idx" ON "sessions" USING btree ("refresh_token_hash");--> statement-breakpoint
CREATE INDEX "sessions_expires_at_idx" ON "sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "broker_accounts_user_id_idx" ON "broker_accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "broker_accounts_type_idx" ON "broker_accounts" USING btree ("broker_type");--> statement-breakpoint
CREATE INDEX "broker_accounts_is_active_idx" ON "broker_accounts" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "bot_configs_user_id_idx" ON "bot_configs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "bot_configs_symbol_idx" ON "bot_configs" USING btree ("symbol");--> statement-breakpoint
CREATE INDEX "bot_configs_is_active_idx" ON "bot_configs" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "order_attempts_order_id_idx" ON "order_attempts" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_attempts_shot_index_idx" ON "order_attempts" USING btree ("shot_index");--> statement-breakpoint
CREATE INDEX "order_attempts_is_success_idx" ON "order_attempts" USING btree ("is_success");--> statement-breakpoint
CREATE INDEX "order_attempts_latency_idx" ON "order_attempts" USING btree ("latency_ms");--> statement-breakpoint
CREATE INDEX "orders_user_id_idx" ON "orders" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "orders_symbol_idx" ON "orders" USING btree ("symbol");--> statement-breakpoint
CREATE INDEX "orders_status_idx" ON "orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "orders_scheduled_idx" ON "orders" USING btree ("scheduled_target_time");--> statement-breakpoint
CREATE INDEX "orders_idempotency_idx" ON "orders" USING btree ("idempotency_key");--> statement-breakpoint
CREATE INDEX "symbols_symbol_idx" ON "symbols" USING btree ("symbol");--> statement-breakpoint
CREATE INDEX "symbols_ins_code_idx" ON "symbols" USING btree ("ins_code");--> statement-breakpoint
CREATE INDEX "symbols_is_ipo_idx" ON "symbols" USING btree ("is_ipo");--> statement-breakpoint
CREATE INDEX "symbols_group_idx" ON "symbols" USING btree ("group_name");--> statement-breakpoint
CREATE UNIQUE INDEX "watchlists_user_symbol_idx" ON "watchlists" USING btree ("user_id","symbol");--> statement-breakpoint
CREATE INDEX "watchlists_user_id_idx" ON "watchlists" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "audit_logs_action_idx" ON "audit_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "notifications_user_id_idx" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notifications_is_read_idx" ON "notifications" USING btree ("is_read");