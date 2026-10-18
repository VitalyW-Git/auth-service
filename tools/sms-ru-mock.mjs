#!/usr/bin/env node
/**
 * Заглушка API SMS.ru для разработки: отвечает в формате POST https://sms.ru/sms/send с json=1
 * и печатает текст SMS (вместе с кодом входа) в свой вывод.
 *
 * Зачем: пока у аккаунта SMS.ru нет согласованного буквенного отправителя, настоящий сервис
 * отвечает ошибкой 221 на любой запрос, включая test=1, поэтому успешная ветка SmsRuSmsSender
 * иначе не проверяется.
 *
 * Запуск:    node tools/sms-ru-mock.mjs
 * В .env:    SMS_RU_API_URL=http://127.0.0.1:4100
 * Порт:      SMS_MOCK_PORT (по умолчанию 4100)
 * Ошибка:    SMS_MOCK_STATUS_CODE=230 — вместо успеха отвечать этой ошибкой SMS.ru
 */
import { createServer } from 'node:http'

const HOST = '127.0.0.1'
const PORT = Number(process.env.SMS_MOCK_PORT ?? 4100)
const SEND_PATH = '/sms/send'
// Ошибки SMS.ru, которые умеет возвращать заглушка (SMS_MOCK_STATUS_CODE).
const ERROR_TEXTS = {
	201: 'Не хватает средств на лицевом счету',
	202: 'Неправильно указан получатель',
	207: 'На этот номер нет маршрута для доставки сообщений',
	214: 'Номер зарубежный, а в настройках включена опция "Только номера РФ"',
	221: 'Для работы с нашим сервисом, необходимо создать буквенного отправителя',
	230: 'Превышен общий дневной лимит сообщений на этот номер',
	233: 'Превышен лимит одинаковых сообщений на этот номер в день'
}

// Текст запроса приходит в urlencoded при POST и в query при GET — SMS.ru принимает оба способа.
const readParams = async request => {
	const url = new URL(request.url, `http://${HOST}:${PORT}`)
	if (request.method !== 'POST') {
		return { path: url.pathname, params: url.searchParams }
	}
	const chunks = []
	for await (const chunk of request) {
		chunks.push(chunk)
	}
	return {
		path: url.pathname,
		params: new URLSearchParams(Buffer.concat(chunks).toString('utf8'))
	}
}

const buildSmsResult = () => {
	const statusCode = Number(process.env.SMS_MOCK_STATUS_CODE ?? 100)
	if (statusCode === 100) {
		return {
			status: 'OK',
			status_code: 100,
			sms_id: Math.random().toString(16).slice(2, 10).toUpperCase()
		}
	}
	return {
		status: 'ERROR',
		status_code: statusCode,
		status_text: ERROR_TEXTS[statusCode] ?? 'Ошибка заглушки SMS.ru'
	}
}

// Ответ как у SMS.ru: верхний status — про сам запрос, по каждому номеру — свой статус в sms.
const buildSendResponse = params => {
	const recipients = (params.get('to') ?? '')
		.split(',')
		.map(recipient => recipient.trim())
		.filter(Boolean)
	if (!recipients.length) {
		return { status: 'ERROR', status_code: 202, status_text: ERROR_TEXTS[202] }
	}
	if (!params.get('msg')) {
		return { status: 'ERROR', status_code: 203, status_text: 'Нет текста сообщения' }
	}
	const sms = {}
	for (const recipient of recipients) {
		sms[recipient] = buildSmsResult()
	}
	return { status: 'OK', status_code: 100, sms, balance: 100 }
}

const logRequest = (params, response) => {
	const recipients = params.get('to') ?? '—'
	const mode = params.get('test') === '1' ? ' (test=1)' : ''
	const sender = params.get('from') ? ` from=${params.get('from')}` : ''
	console.log(`[sms-ru-mock] ${recipients}${mode}${sender}: ${params.get('msg') ?? ''}`)
	console.log(`[sms-ru-mock] ответ: ${JSON.stringify(response)}`)
}

const handleRequest = async (request, reply) => {
	const { path, params } = await readParams(request)
	// Метод не найден — код SMS.ru 211, чтобы опечатка в SMS_RU_API_URL была заметна.
	const response =
		path === SEND_PATH
			? buildSendResponse(params)
			: { status: 'ERROR', status_code: 211, status_text: 'Метод не найден' }
	if (path === SEND_PATH) {
		logRequest(params, response)
	} else {
		console.log(`[sms-ru-mock] неизвестный путь ${request.method} ${path}`)
	}
	reply.writeHead(200, { 'content-type': 'application/json; charset=utf-8' })
	reply.end(JSON.stringify(response, null, 4))
}

const server = createServer(handleRequest)

// Порт обычно занят прошлым запуском заглушки: подсказать, как найти процесс, вместо стека Node.
server.on('error', error => {
	if (error.code !== 'EADDRINUSE') {
		throw error
	}
	console.error(`[sms-ru-mock] порт ${PORT} занят. Найти процесс: ss -ltnp | grep ${PORT}`)
	console.error('[sms-ru-mock] либо запустить на другом порту: SMS_MOCK_PORT=4101 npm run sms:mock')
	process.exit(1)
})

server.listen(PORT, HOST, () => {
	const forced = process.env.SMS_MOCK_STATUS_CODE
	console.log(`[sms-ru-mock] слушает http://${HOST}:${PORT}${SEND_PATH}`)
	console.log(
		forced
			? `[sms-ru-mock] принудительная ошибка SMS.ru: ${forced}`
			: '[sms-ru-mock] отвечает успехом, код SMS печатается при каждом запросе'
	)
})
