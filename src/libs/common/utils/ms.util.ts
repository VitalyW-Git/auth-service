const s = 1000
const m = s * 60
const h = m * 60
const d = h * 24
const w = d * 7
const y = d * 365.25

type Unit =
	| 'Years'
	| 'Year'
	| 'Yrs'
	| 'Yr'
	| 'Y'
	| 'Weeks'
	| 'Week'
	| 'W'
	| 'Days'
	| 'Day'
	| 'D'
	| 'Hours'
	| 'Hour'
	| 'Hrs'
	| 'Hr'
	| 'H'
	| 'Minutes'
	| 'Minute'
	| 'Mins'
	| 'Min'
	| 'M'
	| 'Seconds'
	| 'Second'
	| 'Secs'
	| 'Sec'
	| 's'
	| 'Milliseconds'
	| 'Millisecond'
	| 'Msecs'
	| 'Msec'
	| 'Ms'

type UnitAnyCase = Unit | Uppercase<Unit> | Lowercase<Unit>

export type StringValue =
	| `${number}`
	| `${number}${UnitAnyCase}`
	| `${number} ${UnitAnyCase}`

/**
 * Преобразует строковое значение времени в миллисекунды.
 *
 * Метод используется для конвертации человекочитаемых строк времени (например, "1 hour", "30 minutes")
 * в числовое значение в миллисекундах, которое требуется для настройки временных интервалов в API.
 *
 * Применение в проекте:
 * - Настройка maxAge для cookie сессий (src/main.ts:40)
 *   Позволяет задавать время жизни сессии в переменных окружения в удобном формате:
 *   SESSION_MAX_AGE="2 hours" вместо числового значения 7200000
 *
 * Поддерживаемые единицы времени:
 * - Годы: years, year, yrs, yr, y
 * - Недели: weeks, week, w
 * - Дни: days, day, d
 * - Часы: hours, hour, hrs, hr, h
 * - Минуты: minutes, minute, mins, min, m
 * - Секунды: seconds, second, secs, sec, s
 * - Миллисекунды: milliseconds, millisecond, msecs, msec, ms
 *
 * Единицы можно указывать в любом регистре, с пробелом или без.
 *
 * @param str - Строка с числом и единицей времени (например, "1 hour", "30m", "500ms", "30d")
 * @returns Число миллисекунд или NaN, если строка не распознана
 *
 * @example
 * ms('1 minute')  // вернет 60000
 * ms('2 hours')   // вернет 7200000
 * ms('500 ms')    // вернет 500
 * ms('1d')        // вернет 86400000
 * ms('30')        // вернет 30 (по умолчанию миллисекунды)
 */
export function ms(str: StringValue): number {
	if (typeof str !== 'string' || str.length === 0 || str.length > 100) {
		throw new Error(
			'Value provided to ms() must be a string with length between 1 and 99.'
		)
	}

	const match =
		/^(?<value>-?(?:\d+)?\.?\d+) *(?<type>milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(
			str
		)

	const groups = match?.groups as { value: string; type?: string } | undefined
	if (!groups) {
		return NaN
	}
	const n = parseFloat(groups.value)
	const type = (groups.type || 'ms').toLowerCase() as Lowercase<Unit>

	switch (type) {
		case 'years':
		case 'year':
		case 'yrs':
		case 'yr':
		case 'y':
			return n * y
		case 'weeks':
		case 'week':
		case 'w':
			return n * w
		case 'days':
		case 'day':
		case 'd':
			return n * d
		case 'hours':
		case 'hour':
		case 'hrs':
		case 'hr':
		case 'h':
			return n * h
		case 'minutes':
		case 'minute':
		case 'mins':
		case 'min':
		case 'm':
			return n * m
		case 'seconds':
		case 'second':
		case 'secs':
		case 'sec':
		case 's':
			return n * s
		case 'milliseconds':
		case 'millisecond':
		case 'msecs':
		case 'msec':
		case 'ms':
			return n
		default:
			throw new Error(
				`Ошибка: единица времени ${type} была распознана, но не существует соответствующего случая. Пожалуйста, проверьте введенные данные.`
			)
	}
}
