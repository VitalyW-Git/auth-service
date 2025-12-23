import { Options } from '@mikro-orm/core'
import { Migrator } from '@mikro-orm/migrations'
import { PostgreSqlDriver } from '@mikro-orm/postgresql'
import { ConfigService } from '@nestjs/config'
import { config } from 'dotenv'

import { AppointmentEntity } from '@/modules/appointment/infrastructure/persistence/entities/appointment.entity'
import { PatientEntity } from '@/modules/appointment/infrastructure/persistence/entities/patient.entity'
import { AccountEntity } from '@/modules/auth/infrastructure/persistence/entities/account.entity'
import { TokenEntity } from '@/modules/auth/infrastructure/persistence/entities/token.entity'
import { ClinicMemberEntity } from '@/modules/clinic/infrastructure/persistence/entities/clinic-member.entity'
import { ClinicServiceEntity } from '@/modules/clinic/infrastructure/persistence/entities/clinic-service.entity'
import { ClinicEntity } from '@/modules/clinic/infrastructure/persistence/entities/clinic.entity'
import { DoctorScheduleExceptionEntity } from '@/modules/clinic/infrastructure/persistence/entities/doctor-schedule-exception.entity'
import { DoctorWorkingHoursEntity } from '@/modules/clinic/infrastructure/persistence/entities/doctor-working-hours.entity'
import { DoctorEntity } from '@/modules/clinic/infrastructure/persistence/entities/doctor.entity'
import { UserEntity } from '@/modules/user/infrastructure/persistence/entities/user.entity'

config()

const getBaseConfig = () =>
	({
		driver: PostgreSqlDriver,
		entities: [
			TokenEntity,
			UserEntity,
			AccountEntity,
			ClinicEntity,
			ClinicMemberEntity,
			DoctorEntity,
			ClinicServiceEntity,
			DoctorWorkingHoursEntity,
			DoctorScheduleExceptionEntity,
			PatientEntity,
			AppointmentEntity
		],
		entitiesTs: [
			'src/database/entities/**/*.entity.ts',
			'src/modules/**/infrastructure/persistence/entities/**/*.entity.ts'
		],
		migrations: {
			path: 'dist/database/migrations',
			pathTs: 'src/database/migrations',
			tableName: 'mikro_orm_migrations',
			transactional: true,
			// Миграции пишутся первыми, сущности — после их применения, поэтому источник истины — база.
			// Без снимка migration:create и migration:check сравнивают сущности с живой схемой БД.
			snapshot: false
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
