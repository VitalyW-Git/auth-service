import { Account } from '@/database/entities'
import {User} from "@/modules/user/domain/entities/user.entity";

export interface IAccountRepository {
	findByProviderId(providerId: string, provider: string): Promise<Account | null>
	create(
    user: User,
		provider: string,
		accessToken: string,
		refreshToken: string,
		expiresAt: number
	): Promise<Account>
}

