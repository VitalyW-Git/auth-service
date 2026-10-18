import { IsNotEmpty, IsString, Matches } from 'class-validator'

export class SendPhoneCodeDto {
	@IsString({ message: 'Телефон должен быть строкой.' })
	@IsNotEmpty({ message: 'Телефон обязателен для заполнения.' })
	@Matches(/^\+7\d{10}$/, { message: 'Введите 10 цифр номера после +7.' })
	phone: string
}
