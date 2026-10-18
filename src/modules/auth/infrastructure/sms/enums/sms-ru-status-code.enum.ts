/**
 * Коды ответа SMS.ru (https://sms.ru/api/send) — те, что влияют на поведение SmsRuSmsSender.
 * Полный список шире; сюда добавляются только обрабатываемые или объясняющие код.
 */
export enum SmsRuStatusCode {
	OK = 100,
	INVALID_PHONE = 202,
	NO_ROUTE = 207,
	FOREIGN_PHONE = 214,
	// Аккаунт без согласованного буквенного отправителя: SMS.ru отклоняет любой запрос, включая test=1.
	NO_SENDER_APPROVED = 221,
	PHONE_DAILY_LIMIT = 230,
	SAME_MESSAGE_PER_MINUTE_LIMIT = 231,
	SAME_MESSAGE_PER_DAY_LIMIT = 232,
	REPEATED_CODE_LIMIT = 233
}
