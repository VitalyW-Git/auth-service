import { Injectable, InternalServerErrorException } from '@nestjs/common'
import { Request } from 'express'

import { UserInterface } from '@/modules/user/domain/common/interfaces/user.interface'

@Injectable()
export class SessionService {
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
						displayName: user.displayName,
						picture: user.picture,
						role: user.role,
						isVerified: user.isVerified,
						isTwoFactorEnabled: user.isTwoFactorEnabled,
						method: user.method,
						createdAt: user.createdAt,
						updatedAt: user.updatedAt
					}
				})
			})
		})
	}
}
