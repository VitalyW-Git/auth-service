import { TokenType } from '@/modules/auth/application/common/enums/token-type.enum'
import { Token } from '@/modules/auth/domain/entities/token.entity'

export interface TokenRepositoryInterface {
	findByTokenAndType(token: string, type: TokenType): Promise<Token | null>
	findByEmailAndType(email: string, type: TokenType): Promise<Token | null>
	save(token: Token): Promise<void>
	delete(token: Token): Promise<void>
}
