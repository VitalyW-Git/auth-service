import { ConfigService } from '@nestjs/config'
import RedisStore from 'connect-redis'
import * as session from 'express-session'
import IORedis from 'ioredis'

import { ms, StringValue } from '@/libs/common/utils/ms.util'
import { parseBoolean } from '@/libs/common/utils/parse-boolean.util'

export const getSessionConfig = (
	configService: ConfigService,
	redisClient: IORedis
): session.SessionOptions => {
	return {
		secret: configService.getOrThrow<string>('SESSION_SECRET'),
		name: configService.getOrThrow<string>('SESSION_NAME'),
		resave: true,
		saveUninitialized: false,
		cookie: {
			domain: configService.getOrThrow<string>('SESSION_DOMAIN'),
			maxAge: ms(
				configService.getOrThrow<StringValue>('SESSION_MAX_AGE')
			),
			httpOnly: parseBoolean(
				configService.getOrThrow<string>('SESSION_HTTP_ONLY')
			),
			secure: parseBoolean(
				configService.getOrThrow<string>('SESSION_SECURE')
			),
			sameSite: 'lax'
		},
		store: new RedisStore({
			client: redisClient,
			prefix: configService.getOrThrow<string>('SESSION_FOLDER')
		})
	}
}
