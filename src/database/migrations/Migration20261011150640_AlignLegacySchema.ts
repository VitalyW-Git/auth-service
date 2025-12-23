import { Migration } from '@mikro-orm/migrations'

// Приводит таблицы users, accounts и tokens, созданные не миграциями MikroORM, к схеме их сущностей:
// uuid вместо text, timestamptz вместо timestamp(3), text + check вместо нативных enum-типов,
// ограничения уникальности и внешний ключ с именами MikroORM.
export class Migration20261011150640_AlignLegacySchema extends Migration {
	override async up(): Promise<void> {
		// Внешний ключ снимается первым: иначе нельзя сменить тип users.id и accounts.user_id.
		this.addSql(
			`alter table "accounts" drop constraint "accounts_user_id_fkey";`
		)
		// Идентификаторы: text → uuid. Все значения — корректные uuid, проверено перед написанием миграции.
		this.addSql(
			`alter table "users" alter column "id" type uuid using ("id"::uuid);`
		)
		this.addSql(
			`alter table "accounts" alter column "id" type uuid using ("id"::uuid);`
		)
		this.addSql(
			`alter table "accounts" alter column "user_id" type uuid using ("user_id"::uuid);`
		)
		this.addSql(
			`alter table "tokens" alter column "id" type uuid using ("id"::uuid);`
		)
		// Время: приложение писало в timestamp(3) без зоны местное время сервера (драйвер pg отбрасывал смещение),
		// поэтому значения трактуются как Europe/Moscow.
		this.addSql(
			`alter table "users" alter column "created_at" type timestamptz using ("created_at" at time zone 'Europe/Moscow'), alter column "created_at" set default now(), alter column "updated_at" type timestamptz using ("updated_at" at time zone 'Europe/Moscow');`
		)
		this.addSql(
			`alter table "accounts" alter column "created_at" type timestamptz using ("created_at" at time zone 'Europe/Moscow'), alter column "created_at" set default now(), alter column "updated_at" type timestamptz using ("updated_at" at time zone 'Europe/Moscow');`
		)
		this.addSql(
			`alter table "tokens" alter column "created_at" type timestamptz using ("created_at" at time zone 'Europe/Moscow'), alter column "created_at" set default now(), alter column "expires_in" type timestamptz using ("expires_in" at time zone 'Europe/Moscow');`
		)
		// Перечисления: нативные типы → text + check, как MikroORM делает для @Enum.
		this.addSql(
			`alter table "users" alter column "role" drop default, alter column "role" type text using ("role"::text), alter column "role" set default 'REGULAR', alter column "method" type text using ("method"::text);`
		)
		this.addSql(
			`alter table "users" add constraint "users_role_check" check ("role" in ('REGULAR', 'ADMIN')), add constraint "users_method_check" check ("method" in ('CREDENTIALS', 'GOOGLE', 'YANDEX'));`
		)
		this.addSql(
			`alter table "tokens" alter column "type" type text using ("type"::text);`
		)
		this.addSql(
			`alter table "tokens" add constraint "tokens_type_check" check ("type" in ('VERIFICATION', 'TWO_FACTOR', 'PASSWORD_RESET'));`
		)
		this.addSql(`drop type "UserRole";`)
		this.addSql(`drop type "AuthMethod";`)
		this.addSql(`drop type "TokenType";`)
		// Уникальность: индексы превращаются в ограничения без перестроения, имена — как у MikroORM.
		this.addSql(
			`alter index "users_email_key" rename to "users_email_unique";`
		)
		this.addSql(
			`alter table "users" add constraint "users_email_unique" unique using index "users_email_unique";`
		)
		this.addSql(
			`alter table "tokens" add constraint "tokens_token_hash_unique" unique using index "tokens_token_hash_unique";`
		)
		// Внешний ключ возвращается под именем MikroORM и получает индекс, которого не было.
		this.addSql(
			`create index "accounts_user_id_index" on "accounts" ("user_id");`
		)
		this.addSql(
			`alter table "accounts" add constraint "accounts_user_id_foreign" foreign key ("user_id") references "users" ("id") on update cascade on delete set null;`
		)
	}

	override async down(): Promise<void> {
		this.addSql(
			`alter table "accounts" drop constraint "accounts_user_id_foreign";`
		)
		this.addSql(`drop index "accounts_user_id_index";`)
		this.addSql(
			`alter table "tokens" drop constraint "tokens_token_hash_unique";`
		)
		this.addSql(
			`create unique index "tokens_token_hash_unique" on "tokens" ("token_hash");`
		)
		this.addSql(`alter table "users" drop constraint "users_email_unique";`)
		this.addSql(
			`create unique index "users_email_key" on "users" ("email");`
		)
		this.addSql(`create type "UserRole" as enum ('REGULAR', 'ADMIN');`)
		this.addSql(
			`create type "AuthMethod" as enum ('CREDENTIALS', 'GOOGLE', 'YANDEX');`
		)
		this.addSql(
			`create type "TokenType" as enum ('VERIFICATION', 'TWO_FACTOR', 'PASSWORD_RESET');`
		)
		this.addSql(`alter table "tokens" drop constraint "tokens_type_check";`)
		this.addSql(
			`alter table "tokens" alter column "type" type "TokenType" using ("type"::"TokenType");`
		)
		this.addSql(
			`alter table "users" drop constraint "users_role_check", drop constraint "users_method_check";`
		)
		this.addSql(
			`alter table "users" alter column "role" drop default, alter column "role" type "UserRole" using ("role"::"UserRole"), alter column "role" set default 'REGULAR'::"UserRole", alter column "method" type "AuthMethod" using ("method"::"AuthMethod");`
		)
		this.addSql(
			`alter table "tokens" alter column "created_at" type timestamp(3) using ("created_at" at time zone 'Europe/Moscow'), alter column "created_at" set default CURRENT_TIMESTAMP, alter column "expires_in" type timestamp(3) using ("expires_in" at time zone 'Europe/Moscow');`
		)
		this.addSql(
			`alter table "accounts" alter column "created_at" type timestamp(3) using ("created_at" at time zone 'Europe/Moscow'), alter column "created_at" set default CURRENT_TIMESTAMP, alter column "updated_at" type timestamp(3) using ("updated_at" at time zone 'Europe/Moscow');`
		)
		this.addSql(
			`alter table "users" alter column "created_at" type timestamp(3) using ("created_at" at time zone 'Europe/Moscow'), alter column "created_at" set default CURRENT_TIMESTAMP, alter column "updated_at" type timestamp(3) using ("updated_at" at time zone 'Europe/Moscow');`
		)
		this.addSql(`alter table "tokens" alter column "id" type text;`)
		this.addSql(`alter table "accounts" alter column "user_id" type text;`)
		this.addSql(`alter table "accounts" alter column "id" type text;`)
		this.addSql(`alter table "users" alter column "id" type text;`)
		this.addSql(
			`alter table "accounts" add constraint "accounts_user_id_fkey" foreign key ("user_id") references "users" ("id") on update cascade on delete set null;`
		)
	}
}
