import { login } from './login.api'
import { logout } from './logout.api'
import { me } from './me.api'
import { refresh } from './refresh.api'
import { register } from './register.api'

export const authApi = {
  register,
  login,
  me,
  logout,
  refresh,
}
