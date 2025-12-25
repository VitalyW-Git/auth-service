import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { EntityManager } from '@mikro-orm/core'
import { CommandBus, QueryBus } from '@nestjs/cqrs'

import { Account, AuthMethod } from '@/database/entities'
import { CreateUserCommand } from '@/modules/user/application/commands/create-user.command'
import { GetUserQuery } from '@/modules/user/application/queries/get-user.query'
import { UserInterface } from '@/modules/user/application/common/interface/user.interface'
import { UserEntity } from '@/modules/user/infrastructure/persistence/entities/user.entity'

import { OAuthCallbackCommand } from '@/modules/auth/application/commands/oauth-callback.command'
import { ProviderService } from '@/modules/auth/infrastructure/provider/provider.service'
import { SessionService } from '@/modules/auth/infrastructure/session/session.service'

@CommandHandler(OAuthCallbackCommand)
export class OAuthCallbackHandler
	implements ICommandHandler<OAuthCallbackCommand>
{
	public constructor(
		private readonly em: EntityManager,
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

		const account = await this.em.findOne(Account, {
			id: profile.id,
			provider: profile.provider
		})

		let user: UserInterface | null = account?.userId
			? await this.queryBus.execute(new GetUserQuery(account.userId))
			: null

		if (user) {
			return this.sessionService.saveSession(command.req, user)
		}

		user = await this.commandBus.execute(
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
      const newAccount = this.em.create(Account, {
        user,
        type: 'oauth',
        provider: profile.provider,
        accessToken: profile.access_token,
        refreshToken: profile.refresh_token,
        expiresAt: profile.expires_at
      })
      await this.em.persistAndFlush(newAccount)
		}

		return this.sessionService.saveSession(command.req, user)
	}
}

