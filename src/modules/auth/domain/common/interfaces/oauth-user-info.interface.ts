// Нормализованный профиль, который OAuth-адаптер отдаёт приложению. Это контракт
// границы (порт), а не сырой ответ провайдера: сырые формы GoogleProfile /
// YandexProfile остаются в infrastructure.
export interface OAuthUserInfoInterface {
	id: string
	picture: string
	name: string
	email: string
	access_token?: string | null
	refresh_token?: string
	expires_at?: number
	provider: string
}
