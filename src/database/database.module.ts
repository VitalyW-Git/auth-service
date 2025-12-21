import { MikroOrmModule } from '@mikro-orm/nestjs'
import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import { getMikroOrmConfig } from '@/config/mikro-orm.config'

@Module({
	imports: [
		MikroOrmModule.forRootAsync({
			inject: [ConfigService],
			useFactory: getMikroOrmConfig
		})
	]
})
export class DatabaseModule {}
