import { z } from 'zod'

import { UserRoleSchema } from './auth'

export const AdminUserRowSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  name: z.string(),
  role: UserRoleSchema,
  createdAt: z.string().datetime(),
})

export const AdminUpdateUserRoleSchema = z.object({
  role: UserRoleSchema,
})

export const AdminUserListSchema = z.array(AdminUserRowSchema)

export type AdminUserRow = z.infer<typeof AdminUserRowSchema>
export type AdminUpdateUserRoleDto = z.infer<typeof AdminUpdateUserRoleSchema>
