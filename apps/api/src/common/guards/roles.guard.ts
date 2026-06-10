import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import type { UserRole } from '@repo/shared'
import type { Request } from 'express'

import type { JwtPayload } from '../../auth/strategies/jwt.strategy.js'
import { IS_PUBLIC_KEY } from '../decorators/public.decorator.js'
import { ROLES_KEY } from '../decorators/roles.decorator.js'

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    if (isPublic) return true

    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    if (!requiredRoles?.length) return true

    const req = context.switchToHttp().getRequest<Request & { user?: JwtPayload }>()
    const role = req.user?.role
    if (!role || !requiredRoles.includes(role)) {
      throw new ForbiddenException('Недостаточно прав')
    }
    return true
  }
}
