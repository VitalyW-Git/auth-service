// Вызывается после проверки кода из SMS: номер уже подтверждён, нужен его аккаунт (ADR 0011).
export class FindOrCreateUserByPhoneCommand {
	constructor(public readonly phone: string) {}
}
