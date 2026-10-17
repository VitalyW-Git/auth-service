import { OAuthUserInfoInterface } from '@/modules/auth/domain/common/interfaces/oauth-user-info.interface'

// Порт одного OAuth-провайдера. Описывает только то, чем пользуются слои
// application и presentation; реализация — BaseOAuthService в infrastructure.
export interface OAuthProviderInterface {
	getAuthUrl(): string
	findUserByCode(code: string): Promise<OAuthUserInfoInterface>
}
