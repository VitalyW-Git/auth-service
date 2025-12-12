import { MailerOptions } from '@nestjs-modules/mailer'
import { ConfigService } from '@nestjs/config'

import { isDev } from '@/libs/common/utils/is-dev.util'

export const getMailerConfig = async (
	configService: ConfigService
): Promise<MailerOptions> => {
	const mailFrom = configService.get<string>('MAIL_FROM') || 
		configService.getOrThrow<string>('MAIL_LOGIN')

  const transport = isDev(configService) ? {
    host: configService.getOrThrow<string>('LOCAL_MAIL_HOST'),
    port: configService.getOrThrow<number>('LOCAL_MAIL_PORT'),
    secure: !isDev(configService),
  } : {
    host: configService.getOrThrow<string>('MAIL_HOST'),
      port: configService.getOrThrow<number>('MAIL_PORT'),
      secure: !isDev(configService),
      auth: {
        user: configService.getOrThrow<string>('MAIL_LOGIN'),
        pass: configService.getOrThrow<string>('MAIL_PASSWORD')
    }
  }
  console.log(transport)

	return {
    transport,
		defaults: {
			from: `"Project" ${mailFrom}`
		}
	}
}
