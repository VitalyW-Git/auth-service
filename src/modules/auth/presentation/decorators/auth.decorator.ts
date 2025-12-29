import { applyDecorators, UseGuards } from '@nestjs/common'

import { Roles } from '@/modules/auth/presentation/decorators/roles.decorator'
import { AuthGuard } from '@/modules/auth/presentation/guards/auth.guard'
import { RolesGuard } from '@/modules/auth/presentation/guards/roles.guard'
import { UserRole } from '@/modules/user/application/common/enums/user-role.enum'

export function Authorization(...roles: UserRole[]) {
	if (!!roles?.length) {
		return applyDecorators(
			Roles(...roles),
			UseGuards(AuthGuard, RolesGuard)
		)
	}

	return applyDecorators(UseGuards(AuthGuard))
}
