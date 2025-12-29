import { Account } from '@/modules/auth/domain/entities/account.entity'
import { AccountEntity } from '@/modules/auth/infrastructure/persistence/entities/account.entity'

export interface AccountRepositoryInterface {
	findByProviderId(
		providerId: string,
		provider: string
	): Promise<Account | null>
	save(account: Account, accountEntity: AccountEntity): Promise<void>
	findById(id: string): Promise<AccountEntity | null>
}
