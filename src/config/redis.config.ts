import { ConfigService } from '@nestjs/config'
import IORedis from 'ioredis'

export const createRedisClient = (configService: ConfigService): IORedis => {
	return new IORedis({
		host: configService.getOrThrow<string>('REDIS_HOST'),
		port: configService.getOrThrow<number>('REDIS_PORT'),
		username: configService.get<string>('REDIS_USER') || 'default',
		password: configService.getOrThrow<string>('REDIS_PASSWORD')
	})
}
