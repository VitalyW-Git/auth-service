import { Options } from '@mikro-orm/core'
import { Migrator } from '@mikro-orm/migrations'
import { PostgreSqlDriver } from '@mikro-orm/postgresql'
import { ConfigService } from '@nestjs/config'
import { config } from 'dotenv'

import { AccountEntity } from '@/modules/auth/infrastructure/persistence/entities/account.entity'
import {TokenEntity} from "@/modules/auth/infrastructure/persistence/entities/token.entity";
import { UserEntity } from '@/modules/user/infrastructure/persistence/entities/user.entity'

config()

const getBaseConfig = () =>
	({
		driver: PostgreSqlDriver,
		entities: [TokenEntity, UserEntity, AccountEntity],
		entitiesTs: [
			'src/database/entities/**/*.entity.ts',
			'src/modules/**/infrastructure/persistence/entities/**/*.entity.ts'
		],
		migrations: {
			path: 'dist/database/migrations',
			pathTs: 'src/database/migrations',
			tableName: 'mikro_orm_migrations',
			transactional: true
		},
		extensions: [Migrator],
		debug: process.env.NODE_ENV !== 'production'
	}) as Omit<
		Options<PostgreSqlDriver>,
		'dbName' | 'host' | 'port' | 'user' | 'password'
	>

export const getMikroOrmConfig = (
	configService: ConfigService
): Options<PostgreSqlDriver> => ({
	...getBaseConfig(),
	driver: PostgreSqlDriver,
	dbName: configService.getOrThrow<string>('POSTGRES_DB'),
	host: configService.getOrThrow<string>('POSTGRES_HOST'),
	port: configService.getOrThrow<number>('POSTGRES_PORT'),
	user: configService.getOrThrow<string>('POSTGRES_USER'),
	password: configService.getOrThrow<string>('POSTGRES_PASSWORD')
})

export default {
	...getBaseConfig(),
	dbName: process.env.POSTGRES_DB || 'auth_db',
	host: process.env.POSTGRES_HOST || 'localhost',
	port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
	user: process.env.POSTGRES_USER || 'postgres',
	password: process.env.POSTGRES_PASSWORD || 'postgres'
} as Options<PostgreSqlDriver>
