import { UserSchema, type UserDto } from '@repo/shared'

import { api } from '@/shared/api/http'

export const me = async (): Promise<UserDto> => {
  const { data } = await api.get<unknown>('/auth/me')
  return UserSchema.parse(data)
}
