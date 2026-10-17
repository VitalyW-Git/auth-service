import { Request } from 'express'

import { UserInterface } from '@/modules/user/domain/common/interfaces/user.interface'

// Порт управления сессией. Тип Request остаётся от express: сессия по своей
// природе привязана к HTTP-запросу, а конкретный адаптер живёт в infrastructure.
export interface SessionServiceInterface {
	saveSession(
		req: Request,
		user: UserInterface
	): Promise<{ user: UserInterface }>
	destroyUserSessions(userId: string): Promise<number>
}
