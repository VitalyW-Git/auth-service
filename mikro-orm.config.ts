import { Migrator } from '@mikro-orm/migrations'
import { defineConfig } from '@mikro-orm/postgresql'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(__dirname, '.env') })

export default defineConfig({
	dbName: process.env.POSTGRES_DB || 'postgres',
	host: process.env.POSTGRES_HOST || 'localhost',
	port: parseInt(process.env.POSTGRES_PORT || '5432'),
	user: process.env.POSTGRES_USER || 'postgres',
	password: process.env.POSTGRES_PASSWORD || 'postgres',
	entities: ['dist/database/entities/**/*.entity.js'],
	entitiesTs: ['src/database/entities/**/*.entity.ts'],
	migrations: {
		path: 'dist/database/migrations',
		pathTs: 'src/database/migrations',
		tableName: 'mikro_orm_migrations',
		transactional: true
	},
	extensions: [Migrator]
})

