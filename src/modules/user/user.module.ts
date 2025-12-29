import { MikroOrmModule } from '@mikro-orm/nestjs'
import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'

import { CreateUserHandler } from '@/modules/user/application/commands/handlers/create-user.handler'
import { UpdateUserHandler } from '@/modules/user/application/commands/handlers/update-user.handler'
import { VerifyUserHandler } from '@/modules/user/application/commands/handlers/verify-user.handler'
import { GetUserByEmailHandler } from '@/modules/user/application/queries/handlers/get-user-by-email.handler'
import { GetUserHandler } from '@/modules/user/application/queries/handlers/get-user.handler'
import { UserEntity } from '@/modules/user/infrastructure/persistence/entities/user.entity'
import { UserRepository } from '@/modules/user/infrastructure/repositories/user.repository'
import { UserController } from '@/modules/user/presentation/controllers/user.controller'

const CommandHandlers = [
	CreateUserHandler,
	UpdateUserHandler,
	VerifyUserHandler
]

const QueryHandlers = [GetUserHandler, GetUserByEmailHandler]

@Module({
	imports: [CqrsModule, MikroOrmModule.forFeature([UserEntity])],
	controllers: [UserController],
	providers: [
		...CommandHandlers,
		...QueryHandlers,
		{
			provide: 'UserRepositoryInterface',
			useClass: UserRepository
		}
	],
	exports: ['UserRepositoryInterface', ...QueryHandlers, ...CommandHandlers]
})
export class UserModule {}
