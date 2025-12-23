import { IsNotEmpty, IsString, Matches } from 'class-validator'

export class PhoneLoginDto {
	@IsString({ message: 'Телефон должен быть строкой.' })
	@IsNotEmpty({ message: 'Телефон обязателен для заполнения.' })
	@Matches(/^\+7\d{10}$/, { message: 'Введите 10 цифр номера после +7.' })
	phone: string

	@IsString({ message: 'Код должен быть строкой.' })
	@IsNotEmpty({ message: 'Код обязателен для заполнения.' })
	@Matches(/^\d{4}$/, { message: 'Код должен состоять из 4 цифр.' })
	code: string
}
