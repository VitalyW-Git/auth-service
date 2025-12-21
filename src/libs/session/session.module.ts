import { Global, Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'

import { createRedisClient } from '@/config/redis.config'

export const REDIS_CLIENT = 'REDIS_CLIENT'

@Global()
@Module({
	imports: [ConfigModule],
	providers: [
		{
			provide: REDIS_CLIENT,
			useFactory: (configService: ConfigService) => {
				return createRedisClient(configService)
			},
			inject: [ConfigService]
		}
	],
	exports: [REDIS_CLIENT]
})
export class SessionModule {}
