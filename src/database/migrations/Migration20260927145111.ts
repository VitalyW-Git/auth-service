import { Migration } from '@mikro-orm/migrations'

export class Migration20260927145111 extends Migration {
	override async up(): Promise<void> {
		this.addSql(
			`alter table "tokens" rename column "token" to "token_hash";`
		)
		this.addSql(
			`alter index if exists "tokens_token_unique" rename to "tokens_token_hash_unique";`
		)
		this.addSql(
			`alter index if exists "tokens_token_key" rename to "tokens_token_hash_unique";`
		)
	}

	override async down(): Promise<void> {
		this.addSql(
			`alter table "tokens" rename column "token_hash" to "token";`
		)
		this.addSql(
			`alter index if exists "tokens_token_hash_unique" rename to "tokens_token_unique";`
		)
	}
}
