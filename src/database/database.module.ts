import { MikroOrmModule } from '@mikro-orm/nestjs'
import { PostgreSqlDriver } from '@mikro-orm/postgresql'
import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import { Account, Token, User } from './entities'

@Module({
	imports: [
		MikroOrmModule.forRootAsync({
			inject: [ConfigService],
			useFactory: (configService: ConfigService) => ({
				driver: PostgreSqlDriver,
				dbName: configService.getOrThrow<string>('POSTGRES_DB'),
				host: configService.getOrThrow<string>('POSTGRES_HOST'),
				port: configService.getOrThrow<number>('POSTGRES_PORT'),
				user: configService.getOrThrow<string>('POSTGRES_USER'),
				password: configService.getOrThrow<string>('POSTGRES_PASSWORD'),
				entities: [User, Account, Token],
				debug: process.env.NODE_ENV !== 'production'
			})
		})
	]
})
export class DatabaseModule {}
