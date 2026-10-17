import {
	Inject,
	Injectable,
	InternalServerErrorException
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Request } from 'express'
import IORedis from 'ioredis'

import { REDIS_CLIENT } from '@/libs/session/session.module'
import { SessionServiceInterface } from '@/modules/auth/domain/common/interfaces/session-service.interface'
import { UserInterface } from '@/modules/user/domain/common/interfaces/user.interface'

const SCAN_BATCH_SIZE = 100

@Injectable()
export class SessionService implements SessionServiceInterface {
	public constructor(
		@Inject(REDIS_CLIENT) private readonly redis: IORedis,
		private readonly configService: ConfigService
	) {}

	public async saveSession(
		req: Request,
		user: UserInterface
	): Promise<{ user: UserInterface }> {
		return new Promise((resolve, reject) => {
			req.session.userId = user.id

			req.session.save(err => {
				if (err) {
					return reject(
						new InternalServerErrorException(
							'Не удалось сохранить сессию. Проверьте, правильно ли настроены параметры сессии.'
						)
					)
				}

				resolve({
					user: {
						id: user.id,
						email: user.email,
						name: user.name,
						picture: user.picture,
						role: user.role,
						isVerified: user.isVerified,
						isTwoFactorEnabled: user.isTwoFactorEnabled,
						method: user.method,
						createdAt: user.createdAt,
						updatedAt: user.updatedAt,
						phone: user.phone,
						isPhoneVerified: user.isPhoneVerified
					}
				})
			})
		})
	}

	/**
	 * connect-redis хранит сессии под ключами `<SESSION_FOLDER><sessionId>` без
	 * индекса по пользователю, поэтому перебираются все ключи сессий. Метод
	 * вызывается только при сбросе пароля, а это достаточно редко, чтобы полный
	 * SCAN был допустим.
	 */
	public async destroyUserSessions(userId: string): Promise<number> {
		const keys = await this.findSessionKeys()
		const userKeys = await this.filterUserSessionKeys(keys, userId)
		if (userKeys.length === 0) {
			return 0
		}
		return this.redis.del(...userKeys)
	}

	private async findSessionKeys(): Promise<string[]> {
		const pattern = `${this.configService.getOrThrow<string>('SESSION_FOLDER')}*`
		const keys: string[] = []
		let cursor = '0'
		do {
			const [nextCursor, batch] = await this.redis.scan(
				cursor,
				'MATCH',
				pattern,
				'COUNT',
				SCAN_BATCH_SIZE
			)
			keys.push(...batch)
			cursor = nextCursor
		} while (cursor !== '0')
		return keys
	}

	private async filterUserSessionKeys(
		keys: string[],
		userId: string
	): Promise<string[]> {
		if (keys.length === 0) {
			return []
		}
		const sessions = await this.redis.mget(...keys)
		return keys.filter((_, index) =>
			this.isUserSession(sessions[index], userId)
		)
	}

	private isUserSession(session: string | null, userId: string): boolean {
		if (!session) {
			return false
		}
		try {
			return JSON.parse(session).userId === userId
		} catch {
			return false
		}
	}
}
