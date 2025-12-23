import { Migration } from '@mikro-orm/migrations'

// users.display_name → users.name, необязательное: аккаунт, созданный по телефону, имени не имеет,
// его спросят позже (при записи на приём).
export class Migration20261013220131_RenameDisplayNameToName extends Migration {
	override async up(): Promise<void> {
		this.addSql(
			`alter table "users" rename column "display_name" to "name";`
		)
		this.addSql(`alter table "users" alter column "name" drop not null;`)
		this.addSql(
			`comment on column "users"."name" is 'Name shown to staff and patients; NULL until the user provides it';`
		)
	}

	override async down(): Promise<void> {
		// Пользователей без имени не вернуть в схему с обязательным именем — откат останавливается.
		this.addSql(
			`do $$ begin if exists (select 1 from "users" where "name" is null) then raise exception 'RenameDisplayNameToName down: есть пользователи без имени'; end if; end $$;`
		)
		this.addSql(`comment on column "users"."name" is null;`)
		this.addSql(`alter table "users" alter column "name" set not null;`)
		this.addSql(
			`alter table "users" rename column "name" to "display_name";`
		)
	}
}
