import { OAuthProviderInterface } from '@/modules/auth/domain/common/interfaces/oauth-provider.interface'

// Порт выбора OAuth-провайдера по имени маршрута (:provider).
export interface ProviderServiceInterface {
	findByService(service: string): OAuthProviderInterface | null
}
