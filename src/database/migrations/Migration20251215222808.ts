import { Migration } from '@mikro-orm/migrations'

export class Migration20251215222808 extends Migration {
	override async up(): Promise<void> {
		this.addSql(
			`create table "tokens" ("id" uuid not null, "email" varchar(255) not null, "token" varchar(255) not null, "type" text check ("type" in ('VERIFICATION', 'TWO_FACTOR', 'PASSWORD_RESET')) not null, "expires_in" timestamptz not null, "created_at" timestamptz not null, constraint "tokens_pkey" primary key ("id"));`
		)
		this.addSql(
			`alter table "tokens" add constraint "tokens_token_unique" unique ("token");`
		)

		this.addSql(
			`create table "users" ("id" uuid not null, "email" varchar(255) not null, "password" varchar(255) not null, "display_name" varchar(255) not null, "picture" varchar(255) null, "role" text check ("role" in ('REGULAR', 'ADMIN')) not null default 'REGULAR', "is_verified" boolean not null default false, "is_two_factor_enabled" boolean not null default false, "method" text check ("method" in ('CREDENTIALS', 'GOOGLE', 'YANDEX')) not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, constraint "users_pkey" primary key ("id"));`
		)
		this.addSql(
			`alter table "users" add constraint "users_email_unique" unique ("email");`
		)

		this.addSql(
			`create table "accounts" ("id" uuid not null, "type" varchar(255) not null, "provider" varchar(255) not null, "refresh_token" varchar(255) null, "access_token" varchar(255) null, "expires_at" int not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "user_id" uuid null, constraint "accounts_pkey" primary key ("id"));`
		)

		this.addSql(
			`alter table "accounts" add constraint "accounts_user_id_foreign" foreign key ("user_id") references "users" ("id") on update cascade on delete set null;`
		)
	}
}
