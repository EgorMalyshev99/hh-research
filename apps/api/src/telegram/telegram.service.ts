import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import type { AppConfig } from '../config/config.schema.js'

const TELEGRAM_API_BASE = 'https://api.telegram.org'
const TELEGRAM_MESSAGE_LIMIT = 4096

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name)

  constructor(private readonly configService: ConfigService<AppConfig, true>) {}

  async notifyErrorToGroup(payload: {
    statusCode: number
    path: string
    method: string
    requestId?: string
    message: string
  }): Promise<void> {
    const chatId = this.configService.get('TELEGRAM_ERRORS_CHAT_ID')
    if (!chatId) return

    const text = [
      '🚨 Ошибка API',
      `Статус: ${payload.statusCode}`,
      `Метод: ${payload.method}`,
      `Путь: ${payload.path}`,
      payload.requestId ? `Request ID: ${payload.requestId}` : null,
      `Сообщение: ${payload.message}`,
    ]
      .filter(Boolean)
      .join('\n')

    await this.sendMessage(chatId, text)
  }

  async notifyVacanciesToUser(chatId: string, vacancies: { title: string; url: string }[]): Promise<void> {
    if (!vacancies.length) return
    const maxItems = this.configService.get('TELEGRAM_VACANCY_DIGEST_LIMIT')
    const items = vacancies.slice(0, maxItems)

    const lines = items.map(
      (vacancy, index) => `${index + 1}. <a href="${escapeHtml(vacancy.url)}">${escapeHtml(vacancy.title)}</a>`
    )
    const text = ['Новые вакансии из последнего прогона:', '', ...lines].join('\n')

    await this.sendMessage(chatId, text)
  }

  private async sendMessage(chatId: string, text: string): Promise<void> {
    const token = this.configService.get('TELEGRAM_BOT_TOKEN')
    if (!token) return

    const safeText = text.length > TELEGRAM_MESSAGE_LIMIT ? `${text.slice(0, TELEGRAM_MESSAGE_LIMIT - 3)}...` : text

    try {
      const response = await fetch(`${TELEGRAM_API_BASE}/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: safeText,
          parse_mode: 'HTML',
          disable_web_page_preview: true,
        }),
      })
      if (!response.ok) {
        const body = await response.text()
        this.logger.warn(`Telegram API вернул ${response.status}: ${body}`)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      this.logger.warn(`Не удалось отправить сообщение в Telegram: ${message}`)
    }
  }
}

function escapeHtml(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')
}
