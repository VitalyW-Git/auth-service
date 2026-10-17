// Ответ https://sms.ru/sms/send при json=1. Ключ в sms — номер без «+».
export interface SmsRuSendResponseInterface {
	status: 'OK' | 'ERROR'
	status_code: number
	status_text?: string
	balance?: number
	sms?: Record<
		string,
		{
			status: 'OK' | 'ERROR'
			status_code: number
			sms_id?: string
			status_text?: string
		}
	>
}
