import axios from 'axios'
import { toast } from 'vue-sonner'

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (error.message) {
      return error.message
    }
    const data = error.response?.data
    if (data && typeof data === 'object' && 'message' in data) {
      const raw = (data as { message?: unknown }).message
      if (Array.isArray(raw)) {
        return raw.join('; ')
      }
      if (typeof raw === 'string' && raw.trim().length > 0) {
        return raw
      }
    }
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return 'Не удалось выполнить запрос.'
}

export function showApiMutationErrorToast(error: unknown, title = 'Ошибка API'): void {
  toast.error(title, {
    description: getApiErrorMessage(error),
  })
}
