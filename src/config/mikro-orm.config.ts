import { Options } from '@mikro-orm/core'
import { PostgreSqlDriver } from '@mikro-orm/postgresql'
import { Migrator } from '@mikro-orm/migrations'
import { ConfigService } from '@nestjs/config'
import { config } from 'dotenv'

import { Account, Token, User } from '@/database/entities'

config()

const getBaseConfig = (): Omit<Options<PostgreSqlDriver>, 'dbName' | 'host' | 'port' | 'user' | 'password'> => ({
	driver: PostgreSqlDriver,
	entities: [User, Account, Token],
	entitiesTs: ['src/database/entities/**/*.entity.ts'],
	migrations: {
		path: 'dist/database/migrations',
		pathTs: 'src/database/migrations',
		tableName: 'mikro_orm_migrations',
		transactional: true
	},
	extensions: [Migrator],
	debug: process.env.NODE_ENV !== 'production'
})

export const getMikroOrmConfig = (
	configService: ConfigService
): Options<PostgreSqlDriver> => ({
	...getBaseConfig(),
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

