import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import { CommandBus, QueryBus } from '@nestjs/cqrs'

import { AuthMethod } from '@/database/entities'
import { CreateUserCommand } from '@/modules/user/application/commands/create-user.command'
import { GetUserQuery } from '@/modules/user/application/queries/get-user.query'
import { UserInterface } from '@/modules/user/application/common/interface/user.interface'

import { OAuthCallbackCommand } from '@/modules/auth/application/commands/oauth-callback.command'
import { IAccountRepository } from '@/modules/auth/domain/repository-interfaces/account.repository.interface'
import { ProviderService } from '@/modules/auth/infrastructure/provider/provider.service'
import { SessionService } from '@/modules/auth/infrastructure/session/session.service'

@CommandHandler(OAuthCallbackCommand)
export class OAuthCallbackHandler
	implements ICommandHandler<OAuthCallbackCommand>
{
	public constructor(
		@Inject('IAccountRepository')
		private readonly accountRepository: IAccountRepository,
		private readonly commandBus: CommandBus,
		private readonly queryBus: QueryBus,
		private readonly providerService: ProviderService,
		private readonly sessionService: SessionService
	) {}

	public async execute(
		command: OAuthCallbackCommand
	): Promise<{ user: UserInterface }> {
		const providerInstance = this.providerService.findByService(
			command.provider
		)
		const profile = await providerInstance.findUserByCode(command.code)

		const account = await this.accountRepository.findByProviderId(
			profile.id,
			profile.provider
		)

		let user: UserInterface | null = account?.userId
			? await this.queryBus.execute(new GetUserQuery(account.userId))
			: null

		if (user) {
			return this.sessionService.saveSession(command.req, user)
		}

		const newUser = await this.commandBus.execute(
			new CreateUserCommand(
				profile.email,
				'',
				profile.name,
				profile.picture,
				AuthMethod[profile.provider.toUpperCase()],
				true
			)
		)

		if (!account) {
			await this.accountRepository.create(
        newUser,
				profile.provider,
				profile.access_token,
				profile.refresh_token,
				profile.expires_at
			)
		}

		return this.sessionService.saveSession(command.req, newUser)
	}
}

