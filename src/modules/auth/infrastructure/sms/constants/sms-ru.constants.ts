import { SmsRuStatusCode } from '@/modules/auth/infrastructure/sms/enums/sms-ru-status-code.enum'

// Базовый адрес API SMS.ru (https://sms.ru/api/send); в разработке подменяется через SMS_RU_API_URL.
export const SMS_RU_BASE_URL = 'https://sms.ru'

// Путь метода отправки — общий для настоящего SMS.ru и локальной заглушки tools/sms-ru-mock.mjs.
export const SMS_RU_SEND_PATH = '/sms/send'

export const SMS_RU_REQUEST_TIMEOUT_MS = 10000

// Номер не принимает SMS: неверный, нет маршрута, зарубежный при настройке «только РФ».
export const SMS_RU_INVALID_PHONE_CODES: number[] = [
	SmsRuStatusCode.INVALID_PHONE,
	SmsRuStatusCode.NO_ROUTE,
	SmsRuStatusCode.FOREIGN_PHONE
]

// Лимиты SMS.ru на один номер (защита от накрутки кодов).
export const SMS_RU_PHONE_LIMIT_CODES: number[] = [
	SmsRuStatusCode.PHONE_DAILY_LIMIT,
	SmsRuStatusCode.SAME_MESSAGE_PER_MINUTE_LIMIT,
	SmsRuStatusCode.SAME_MESSAGE_PER_DAY_LIMIT,
	SmsRuStatusCode.REPEATED_CODE_LIMIT
]
