import { Inject, Injectable } from '@nestjs/common'
import { randomInt } from 'node:crypto'
import { v4 as uuidv4 } from 'uuid'

import { TokenType } from '@/modules/auth/domain/common/enums/token-type.enum'
import { IssuedTokenInterface } from '@/modules/auth/domain/common/interfaces/issued-token.interface'
import { TokenHasherInterface } from '@/modules/auth/domain/common/interfaces/token-hasher.interface'
import { Token } from '@/modules/auth/domain/entities/token.entity'
import { TokenRepositoryInterface } from '@/modules/auth/domain/repository-interfaces/token.repository.interface'

@Injectable()
export class TokenGenerationService {
	public constructor(
		@Inject('TokenRepositoryInterface')
		private readonly tokenRepository: TokenRepositoryInterface,
		@Inject('TokenHasherInterface')
		private readonly tokenHasher: TokenHasherInterface
	) {}

	public async generateVerificationToken(
		email: string
	): Promise<IssuedTokenInterface> {
		const expiresIn: Date = new Date(new Date().getTime() + 3600 * 1000)
		return await this.getNewToken(email, TokenType.VERIFICATION, expiresIn)
	}

	public async generatePasswordResetToken(
		email: string
	): Promise<IssuedTokenInterface> {
		const expiresIn: Date = new Date(new Date().getTime() + 3600 * 1000)
		return await this.getNewToken(
			email,
			TokenType.PASSWORD_RESET,
			expiresIn
		)
	}

	public async generateTwoFactorToken(
		email: string
	): Promise<IssuedTokenInterface> {
		const token: string = randomInt(100000, 1000000).toString()
		const expiresIn: Date = new Date(new Date().getTime() + 300000)
		return await this.getNewToken(
			email,
			TokenType.TWO_FACTOR,
			expiresIn,
			token
		)
	}

	// Код из SMS: 4 цифры, действует 5 минут; прежний код номера удаляется.
	public async generatePhoneCode(phone: string): Promise<string> {
		const code: string = randomInt(1000, 10000).toString()
		const expiresIn: Date = new Date(new Date().getTime() + 300000)
		const existingToken: Token | null =
			await this.tokenRepository.findByPhoneAndType(
				phone,
				TokenType.PHONE_VERIFICATION
			)
		if (existingToken) {
			await this.tokenRepository.delete(existingToken)
		}
		const newToken: Token = Token.createForPhone(
			phone,
			this.tokenHasher.hash(Token.buildPhoneCodeHashInput(phone, code)),
			TokenType.PHONE_VERIFICATION,
			expiresIn
		)
		await this.tokenRepository.save(newToken)
		return code
	}

	private async getNewToken(
		email: string,
		tokenType: TokenType,
		expiresIn: Date,
		value: string = uuidv4()
	): Promise<IssuedTokenInterface> {
		const existingToken: Token =
			await this.tokenRepository.findByEmailAndType(email, tokenType)
		if (existingToken) {
			await this.tokenRepository.delete(existingToken)
		}
		const newToken: Token = Token.create(
			email,
			this.tokenHasher.hash(value),
			tokenType,
			expiresIn
		)
		await this.tokenRepository.save(newToken)
		return { email: newToken.getEmail(), value }
	}
}
