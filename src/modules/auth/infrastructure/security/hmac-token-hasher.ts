import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createHmac } from 'node:crypto'

import { TokenHasherInterface } from '@/modules/auth/domain/common/interfaces/token-hasher.interface'

/**
 * HMAC вместо простого SHA-256: код 2FA — всего 900 000 вариантов, и без
 * секрета, который лежит вне БД, слитую таблицу токенов можно перебрать за секунды.
 */
@Injectable()
export class HmacTokenHasher implements TokenHasherInterface {
	private readonly secret: string

	public constructor(configService: ConfigService) {
		this.secret = configService.getOrThrow<string>('TOKEN_HMAC_SECRET')
	}

	public hash(value: string): string {
		return createHmac('sha256', this.secret).update(value).digest('hex')
	}
}
