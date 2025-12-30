import { Account } from '@/modules/auth/domain/entities/account.entity'

export interface AccountRepositoryInterface {
	findByProviderId(
		providerId: string,
		provider: string
	): Promise<Account | null>
	save(newAccount: Account, account: Account): Promise<void>
	findById(id: string): Promise<Account | null>
}
