import { Inject, Injectable } from '@nestjs/common'
import { v4 as uuidv4 } from 'uuid'

import { TokenType } from '@/modules/auth/domain/common/enums/token-type.enum'
import { Token } from '@/modules/auth/domain/entities/token.entity'
import { TokenRepositoryInterface } from '@/modules/auth/domain/repository-interfaces/token.repository.interface'

@Injectable()
export class TokenGenerationService {
	public constructor(
		@Inject('TokenRepositoryInterface')
		private readonly tokenRepository: TokenRepositoryInterface
	) {}

	public async generateVerificationToken(email: string): Promise<Token> {
		const expiresIn: Date = new Date(new Date().getTime() + 3600 * 1000)
		return await this.getNewToken(email, TokenType.VERIFICATION, expiresIn)
	}

	public async generatePasswordResetToken(email: string): Promise<Token> {
		const expiresIn: Date = new Date(new Date().getTime() + 3600 * 1000)
		return await this.getNewToken(
			email,
			TokenType.PASSWORD_RESET,
			expiresIn
		)
	}

	public async generateTwoFactorToken(email: string): Promise<Token> {
		const token: string = Math.floor(
			Math.random() * (1000000 - 100000) + 100000
		).toString()
		const expiresIn: Date = new Date(new Date().getTime() + 300000)
		return await this.getNewToken(
			email,
			TokenType.TWO_FACTOR,
			expiresIn,
			token
		)
	}

	private async getNewToken(
		email: string,
		tokenType: TokenType,
		expiresIn: Date,
		token: string = uuidv4()
	): Promise<Token> {
		const existingToken: Token =
			await this.tokenRepository.findByEmailAndType(email, tokenType)
		if (existingToken) {
			await this.tokenRepository.delete(existingToken)
		}
		const newToken: Token = Token.create(email, token, tokenType, expiresIn)
		await this.tokenRepository.save(newToken)
		return newToken
	}
}
