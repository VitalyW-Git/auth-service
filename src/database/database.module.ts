import { MikroOrmModule } from '@mikro-orm/nestjs'
import { PostgreSqlDriver } from '@mikro-orm/postgresql'
import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import { getMikroOrmConfig } from '@/config/mikro-orm.config'

@Module({
	imports: [
		MikroOrmModule.forRootAsync({
			driver: PostgreSqlDriver,
			inject: [ConfigService],
			useFactory: getMikroOrmConfig
		})
	]
})
export class DatabaseModule {}
