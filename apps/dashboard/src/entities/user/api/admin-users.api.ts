import { AdminUserListSchema, AdminUpdateUserRoleSchema, type UserRole } from '@repo/shared'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'

import { api } from '@/shared/api/http'
import { queryKeys } from '@/shared/lib/query-keys'

export const fetchAdminUsers = async () => {
  const { data } = await api.get<unknown>('/users')
  return AdminUserListSchema.parse(data)
}

export const updateUserRole = async (params: { id: number; role: UserRole }) => {
  const body = AdminUpdateUserRoleSchema.parse({ role: params.role })
  const { data } = await api.patch<unknown>(`/users/${params.id}/role`, body)
  return AdminUserListSchema.element.parse(data)
}

export const useAdminUsersQuery = () =>
  useQuery({
    queryKey: queryKeys.adminUsers.list(),
    queryFn: fetchAdminUsers,
  })

export const useUpdateUserRoleMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: updateUserRole,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.adminUsers.all() }),
  })
}
