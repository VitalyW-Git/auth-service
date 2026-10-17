export interface SmsSenderInterface {
	send(phone: string, text: string): Promise<void>
	// true — SMS до абонента не доходит, код смотрят в логе сервера (только в разработке).
	isTestMode(): boolean
}
