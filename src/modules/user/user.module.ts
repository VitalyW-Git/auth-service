import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'
import { MikroOrmModule } from '@mikro-orm/nestjs'

import { UserEntity } from './infrastructure/persistence/entities/user.entity'
import { UserRepository } from './infrastructure/repositories/user.repository'
import { UserController } from './presentation/controllers/user.controller'
import { CreateUserHandler } from './application/commands/handlers/create-user.handler'
import { UpdateUserHandler } from './application/commands/handlers/update-user.handler'
import { VerifyUserHandler } from './application/commands/handlers/verify-user.handler'
import { GetUserHandler } from './application/queries/handlers/get-user.handler'
import { GetUserByEmailHandler } from './application/queries/handlers/get-user-by-email.handler'

const CommandHandlers = [
	CreateUserHandler,
	UpdateUserHandler,
	VerifyUserHandler
]

const QueryHandlers = [GetUserHandler, GetUserByEmailHandler]

@Module({
	imports: [
		CqrsModule,
		MikroOrmModule.forFeature([UserEntity])
	],
	controllers: [UserController],
	providers: [
		...CommandHandlers,
		...QueryHandlers,
		{
			provide: 'IUserRepository',
			useClass: UserRepository
		}
	],
	exports: ['IUserRepository', ...QueryHandlers, ...CommandHandlers]
})
export class UserModule {}

