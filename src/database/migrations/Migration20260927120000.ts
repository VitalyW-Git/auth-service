import { Migration } from '@mikro-orm/migrations'

export class Migration20260927120000 extends Migration {
	override async up(): Promise<void> {
		this.addSql(`delete from "tokens";`)
		this.addSql(
			`alter table "tokens" add column "attempts" int not null default 0;`
		)
		this.addSql(
			`comment on column "tokens"."attempts" is 'How many times a code was entered; incremented before the check';`
		)
	}

	override async down(): Promise<void> {
		// Хеш не обратить, а старый код ищет по открытому значению — выданные токены всё равно стали бы бесполезны.
		this.addSql(`delete from "tokens";`)
		this.addSql(`alter table "tokens" drop column "attempts";`)
	}
}
