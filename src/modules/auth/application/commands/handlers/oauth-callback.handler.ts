import { Inject } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { CommandBus, QueryBus } from '@nestjs/cqrs'

import { OAuthCallbackCommand } from '@/modules/auth/application/commands/oauth-callback.command'
import { AuthMethod } from '@/modules/auth/domain/common/enums/auth-method.enum'
import { ProviderServiceInterface } from '@/modules/auth/domain/common/interfaces/provider-service.interface'
import { SessionServiceInterface } from '@/modules/auth/domain/common/interfaces/session-service.interface'
import { Account } from '@/modules/auth/domain/entities/account.entity'
import { AccountRepositoryInterface } from '@/modules/auth/domain/repository-interfaces/account.repository.interface'
import { CreateUserCommand } from '@/modules/user/application/commands/create-user.command'
import {
	GetUserQuery,
	GetUserResult
} from '@/modules/user/application/queries/get-user.query'
import { UserInterface } from '@/modules/user/domain/common/interfaces/user.interface'
import { User } from '@/modules/user/domain/entities/user.entity'

@CommandHandler(OAuthCallbackCommand)
export class OAuthCallbackHandler
	implements ICommandHandler<OAuthCallbackCommand>
{
	public constructor(
		@Inject('AccountRepositoryInterface')
		private readonly accountRepository: AccountRepositoryInterface,
		private readonly commandBus: CommandBus,
		private readonly queryBus: QueryBus,
		@Inject('ProviderServiceInterface')
		private readonly providerService: ProviderServiceInterface,
		@Inject('SessionServiceInterface')
		private readonly sessionService: SessionServiceInterface
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

		const user: UserInterface | null = account?.getUserId()
			? await this.queryBus.execute(
					new GetUserQuery(account.getUserId()!)
				)
			: null

		if (user) {
			return this.sessionService.saveSession(command.req, user)
		}

		const newUser: User = await this.commandBus.execute(
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
			const newAccount = Account.create(
				profile.id,
				'oauth',
				profile.provider,
				profile.access_token,
				profile.refresh_token,
				profile.expires_at,
				newUser.id
			)
			await this.accountRepository.save(newAccount)
		}

		const userResult = GetUserResult.fromUser(newUser)

		return this.sessionService.saveSession(command.req, userResult)
	}
}
