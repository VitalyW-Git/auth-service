import { AccountEntity } from '@/modules/auth/infrastructure/persistence/entities/account.entity'
import { User } from '@/modules/user/domain/entities/user.entity'

export interface IAccountRepository {
	findByProviderId(
		providerId: string,
		provider: string
	): Promise<AccountEntity | null>
	create(
		user: User,
		provider: string,
		accessToken: string,
		refreshToken: string,
		expiresAt: number
	): Promise<AccountEntity>
}
