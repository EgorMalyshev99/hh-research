import { Inject, Injectable } from '@nestjs/common'
import { eq } from 'drizzle-orm'

import { DRIZZLE, type DrizzleDb } from '../database/database.module.js'
import { users, type NewUser, type User } from '../database/schema/index.js'

@Injectable()
export class UsersService {
  constructor(@Inject(DRIZZLE) private db: DrizzleDb) {}

  async findById(id: number): Promise<User | undefined> {
    const [user] = await this.db.select().from(users).where(eq(users.id, id))
    return user
  }

  async findByEmail(email: string): Promise<User | undefined> {
    const [user] = await this.db.select().from(users).where(eq(users.email, email))
    return user
  }

  async create(data: NewUser): Promise<User> {
    const [user] = await this.db.insert(users).values(data).returning()
    if (!user) throw new Error('Не удалось создать пользователя')
    return user
  }

  async updateTelegramChatId(userId: number, chatId: string | null): Promise<void> {
    await this.db.update(users).set({ telegramChatId: chatId, updatedAt: new Date() }).where(eq(users.id, userId))
  }
}
