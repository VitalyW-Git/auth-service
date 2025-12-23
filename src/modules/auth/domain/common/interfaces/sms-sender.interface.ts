export interface SmsSenderInterface {
	send(phone: string, text: string): Promise<void>
}
