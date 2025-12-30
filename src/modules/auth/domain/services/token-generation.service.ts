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
		const expiresIn = new Date(new Date().getTime() + 3600 * 1000)
		const existingToken = await this.tokenRepository.findByEmailAndType(
			email,
			TokenType.VERIFICATION
		)
		if (existingToken) {
			await this.tokenRepository.delete(existingToken)
		}
		const token = Token.create(
			email,
			uuidv4(),
			TokenType.VERIFICATION,
			expiresIn
		)
		await this.tokenRepository.save(token)
		return token
	}

	public async generatePasswordResetToken(email: string): Promise<Token> {
		const expiresIn = new Date(new Date().getTime() + 3600 * 1000)
		const existingToken = await this.tokenRepository.findByEmailAndType(
			email,
			TokenType.PASSWORD_RESET
		)
		if (existingToken) {
			await this.tokenRepository.delete(existingToken)
		}
		const newToken = Token.create(
			email,
			uuidv4(),
			TokenType.PASSWORD_RESET,
			expiresIn
		)
		await this.tokenRepository.save(newToken)
		return newToken
	}

	public async generateTwoFactorToken(email: string): Promise<Token> {
		const token: string = Math.floor(
			Math.random() * (1000000 - 100000) + 100000
		).toString()
		const expiresIn = new Date(new Date().getTime() + 300000)
		const existingToken = await this.tokenRepository.findByEmailAndType(
			email,
			TokenType.TWO_FACTOR
		)
		if (existingToken) {
			await this.tokenRepository.delete(existingToken)
		}
		const newToken = Token.create(
			email,
			token,
			TokenType.TWO_FACTOR,
			expiresIn
		)
		await this.tokenRepository.save(newToken)
		return newToken
	}
}

