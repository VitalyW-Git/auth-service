import { Inject, Injectable, OnModuleInit } from '@nestjs/common'

import { OAuthProviderInterface } from '@/modules/auth/domain/common/interfaces/oauth-provider.interface'
import { ProviderServiceInterface } from '@/modules/auth/domain/common/interfaces/provider-service.interface'

import { ProviderOptionsSymbol, TypeOptions } from './provider.constants'

@Injectable()
export class ProviderService implements OnModuleInit, ProviderServiceInterface {
	public constructor(
		@Inject(ProviderOptionsSymbol) private readonly options: TypeOptions
	) {}

	public onModuleInit() {
		for (const provider of this.options.services) {
			provider.baseUrl = this.options.baseUrl
		}
	}

	public findByService(service: string): OAuthProviderInterface | null {
		return this.options.services.find(s => s.name === service) ?? null
	}
}
