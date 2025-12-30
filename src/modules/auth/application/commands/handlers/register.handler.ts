import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { CommandBus } from '@nestjs/cqrs'

import { RegisterCommand } from '@/modules/auth/application/commands/register.command'
import { AuthMethod } from '@/modules/auth/domain/common/enums/auth-method.enum'
import { EmailConfirmationService } from '@/modules/auth/infrastructure/email-confirmation/email-confirmation.service'
import { CreateUserCommand } from '@/modules/user/application/commands/create-user.command'
import { UserInterface } from '@/modules/user/domain/common/interfaces/user.interface'

@CommandHandler(RegisterCommand)
export class RegisterHandler implements ICommandHandler<RegisterCommand> {
	public constructor(
		private readonly commandBus: CommandBus,
		private readonly emailConfirmationService: EmailConfirmationService
	) {}

	public async execute(command: RegisterCommand): Promise<{
		message: string
	}> {
		const newUser: UserInterface = await this.commandBus.execute(
			new CreateUserCommand(
				command.email,
				command.password,
				command.name,
				'',
				AuthMethod.CREDENTIALS,
				false
			)
		)

		await this.emailConfirmationService.sendVerificationToken(newUser.email)

		return {
			message:
				'Вы успешно зарегистрировались. Пожалуйста, подтвердите ваш email. Сообщение было отправлено на ваш почтовый адрес.'
		}
	}
}
