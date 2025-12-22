import { ConfigService } from '@nestjs/config'

export const isDev = (configService: ConfigService): boolean =>
	configService.getOrThrow('NODE_ENV') === 'development'
