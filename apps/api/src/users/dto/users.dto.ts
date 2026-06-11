import { AdminUpdateUserRoleSchema, AdminUserListSchema, AdminUserRowSchema } from '@repo/shared'
import { createZodDto } from 'nestjs-zod'

export class AdminUserRowDto extends createZodDto(AdminUserRowSchema) {}
export class AdminUserListDto extends createZodDto(AdminUserListSchema) {}
export class AdminUpdateUserRoleBodyDto extends createZodDto(AdminUpdateUserRoleSchema) {}
