import { TokenType } from '@/modules/auth/domain/common/enums/token-type.enum'
import { Token } from '@/modules/auth/domain/entities/token.entity'

export interface TokenRepositoryInterface {
	findByTokenHashAndType(
		tokenHash: string,
		type: TokenType
	): Promise<Token | null>
	findByEmailAndType(email: string, type: TokenType): Promise<Token | null>
	findByPhoneAndType(phone: string, type: TokenType): Promise<Token | null>
	save(token: Token): Promise<void>
	incrementAttempts(token: Token): Promise<Token | null>
	delete(token: Token): Promise<void>
}
