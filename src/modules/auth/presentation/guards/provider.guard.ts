import {
	CanActivate,
	ExecutionContext,
	Inject,
	Injectable,
	NotFoundException
} from '@nestjs/common'
import { Request } from 'express'

import { ProviderServiceInterface } from '@/modules/auth/domain/common/interfaces/provider-service.interface'

@Injectable()
export class AuthProviderGuard implements CanActivate {
	public constructor(
		@Inject('ProviderServiceInterface')
		private readonly providerService: ProviderServiceInterface
	) {}

	public canActivate(context: ExecutionContext) {
		const request = context.switchToHttp().getRequest() as Request

		const provider = request.params.provider

		const providerInstance = this.providerService.findByService(provider)

		if (!providerInstance) {
			throw new NotFoundException(
				`Провайдер "${provider}" не найден. Пожалуйста, проверьте правильность введенных данных.`
			)
		}

		return true
	}
}
