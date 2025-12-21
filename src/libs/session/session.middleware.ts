import { ConfigService } from '@nestjs/config'
import * as session from 'express-session'
import IORedis from 'ioredis'

import { getSessionConfig } from '@/config/session.config'

export const createSessionMiddleware = (
	configService: ConfigService,
	redisClient: IORedis
) => {
	const sessionConfig = getSessionConfig(configService, redisClient)
	return session(sessionConfig)
}
