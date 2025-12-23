import { Migration } from '@mikro-orm/migrations'

// Воронка записи по телефону (ADR 0011): аккаунт без email и пароля, SMS-коды в tokens.
export class Migration20261011221234_PhoneSignup extends Migration {
	override async up(): Promise<void> {
		this.addSql(`alter table "users" alter column "email" drop not null;`)
		this.addSql(
			`alter table "users" alter column "password" drop not null;`
		)
		// У OAuth-пользователей вместо пароля хранилась пустая строка.
		this.addSql(
			`update "users" set "password" = null where "password" = '';`
		)
		this.addSql(`alter table "users" drop constraint "users_method_check";`)
		this.addSql(
			`alter table "users" add constraint "users_method_check" check ("method" in ('CREDENTIALS', 'GOOGLE', 'YANDEX', 'PHONE'));`
		)
		this.addSql(
			`alter table "users" add constraint "users_contact_check" check ("email" is not null or "phone" is not null);`
		)
		this.addSql(
			`alter table "users" add constraint "users_phone_method_check" check ("method" <> 'PHONE' or "phone_verified_at" is not null);`
		)
		this.addSql(
			`comment on column "users"."email" is 'Login email; NULL for accounts created by phone';`
		)
		this.addSql(
			`comment on column "users"."password" is 'Argon2 password hash; NULL for OAuth and phone accounts';`
		)
		this.addSql(
			`comment on column "users"."method" is 'How the account was created: CREDENTIALS, GOOGLE, YANDEX or PHONE';`
		)
		this.addSql(`alter table "tokens" alter column "email" drop not null;`)
		this.addSql(`alter table "tokens" add column "phone" varchar(16) null;`)
		this.addSql(
			`comment on column "tokens"."email" is 'Email the token was sent to; NULL for SMS codes';`
		)
		this.addSql(
			`comment on column "tokens"."phone" is 'Phone the SMS code was sent to, E.164; NULL for email tokens';`
		)
		this.addSql(`alter table "tokens" drop constraint "tokens_type_check";`)
		this.addSql(
			`alter table "tokens" add constraint "tokens_type_check" check ("type" in ('VERIFICATION', 'TWO_FACTOR', 'PASSWORD_RESET', 'PHONE_VERIFICATION'));`
		)
		// Код из SMS адресован только телефону, остальные токены — только email.
		this.addSql(
			`alter table "tokens" add constraint "tokens_recipient_check" check (("type" = 'PHONE_VERIFICATION' and "phone" is not null and "email" is null) or ("type" <> 'PHONE_VERIFICATION' and "email" is not null and "phone" is null));`
		)
	}

	override async down(): Promise<void> {
		// Аккаунты без email не вернуть в схему с обязательным email — откат останавливается.
		this.addSql(
			`do $$ begin if exists (select 1 from "users" where "email" is null or "method" = 'PHONE') then raise exception 'PhoneSignup down: есть аккаунты без email или со способом входа PHONE'; end if; end $$;`
		)
		this.addSql(
			`alter table "tokens" drop constraint "tokens_recipient_check";`
		)
		// SMS-коды живут минуты, их можно удалить.
		this.addSql(`delete from "tokens" where "type" = 'PHONE_VERIFICATION';`)
		this.addSql(`alter table "tokens" drop constraint "tokens_type_check";`)
		this.addSql(
			`alter table "tokens" add constraint "tokens_type_check" check ("type" in ('VERIFICATION', 'TWO_FACTOR', 'PASSWORD_RESET'));`
		)
		this.addSql(`alter table "tokens" drop column "phone";`)
		this.addSql(`comment on column "tokens"."email" is null;`)
		this.addSql(`alter table "tokens" alter column "email" set not null;`)
		this.addSql(`comment on column "users"."method" is null;`)
		this.addSql(`comment on column "users"."password" is null;`)
		this.addSql(`comment on column "users"."email" is null;`)
		this.addSql(
			`alter table "users" drop constraint "users_phone_method_check";`
		)
		this.addSql(
			`alter table "users" drop constraint "users_contact_check";`
		)
		this.addSql(`alter table "users" drop constraint "users_method_check";`)
		this.addSql(
			`alter table "users" add constraint "users_method_check" check ("method" in ('CREDENTIALS', 'GOOGLE', 'YANDEX'));`
		)
		this.addSql(
			`update "users" set "password" = '' where "password" is null;`
		)
		this.addSql(`alter table "users" alter column "password" set not null;`)
		this.addSql(`alter table "users" alter column "email" set not null;`)
	}
}
