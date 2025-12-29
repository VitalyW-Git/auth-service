import { Inject } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { CommandBus, QueryBus } from '@nestjs/cqrs'

import { Account } from '@/modules/auth/domain/entities/account.entity'
import { OAuthCallbackCommand } from '@/modules/auth/application/commands/oauth-callback.command'
import { AccountRepositoryInterface } from '@/modules/auth/domain/repository-interfaces/account.repository.interface'
import { ProviderService } from '@/modules/auth/infrastructure/provider/provider.service'
import { SessionService } from '@/modules/auth/infrastructure/session/session.service'
import { CreateUserCommand } from '@/modules/user/application/commands/create-user.command'
import { UserInterface } from '@/modules/user/application/common/interfaces/user.interface'
import {
	GetUserQuery,
	GetUserResult
} from '@/modules/user/application/queries/get-user.query'
import {AuthMethod} from "@/modules/auth/application/common/enums/auth-method.enum";

@CommandHandler(OAuthCallbackCommand)
export class OAuthCallbackHandler
	implements ICommandHandler<OAuthCallbackCommand>
{
	public constructor(
		@Inject('IAccountRepository')
		private readonly accountRepository: AccountRepositoryInterface,
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

		const user: UserInterface | null = account?.getUserId()
			? await this.queryBus.execute(new GetUserQuery(account.getUserId()!))
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
			const newAccount = Account.create(
				profile.id,
				'oauth',
				profile.provider,
				profile.access_token,
				profile.refresh_token,
				profile.expires_at,
				newUser.id
			)
      const accountEntity = await this.accountRepository.findById(newAccount.id)
			await this.accountRepository.save(newAccount, accountEntity)
		}

		const userResult = new GetUserResult(
			newUser.id,
			newUser.getEmail().getValue(),
			newUser.getDisplayName(),
			newUser.getPicture(),
			newUser.getRole(),
			newUser.getIsVerified(),
			newUser.getIsTwoFactorEnabled(),
			newUser.getMethod(),
			newUser.getCreatedAt(),
			newUser.getUpdatedAt()
		)

		return this.sessionService.saveSession(command.req, userResult)
	}
}
