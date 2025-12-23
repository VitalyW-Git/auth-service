import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { CommandBus } from '@nestjs/cqrs'

import { RegisterCommand } from '@/modules/auth/application/commands/register.command'
import { SendVerificationTokenCommand } from '@/modules/auth/application/commands/send-verification-token.command'
import { AuthMethod } from '@/modules/auth/domain/common/enums/auth-method.enum'
import { CreateUserCommand } from '@/modules/user/application/commands/create-user.command'
import { User } from '@/modules/user/domain/entities/user.entity'

@CommandHandler(RegisterCommand)
export class RegisterHandler implements ICommandHandler<RegisterCommand> {
	public constructor(private readonly commandBus: CommandBus) {}

	public async execute(command: RegisterCommand): Promise<{
		message: string
	}> {
		const newUser: User = await this.commandBus.execute(
			new CreateUserCommand(
				command.email,
				command.password,
				command.name,
				'',
				AuthMethod.CREDENTIALS,
				false
			)
		)

		await this.commandBus.execute(
			new SendVerificationTokenCommand(newUser.getEmail().getValue())
		)

		return {
			message:
				'Вы успешно зарегистрировались. Пожалуйста, подтвердите ваш email. Сообщение было отправлено на ваш почтовый адрес.'
		}
	}
}
