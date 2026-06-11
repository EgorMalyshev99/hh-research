import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import type { UserRole } from '@repo/shared'
import { desc, eq } from 'drizzle-orm'

import { DRIZZLE, type DrizzleDb } from '../database/database.module.js'
import { refreshTokens, users, type NewUser, type User } from '../database/schema/index.js'

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

  async listAll(): Promise<User[]> {
    return this.db.select().from(users).orderBy(desc(users.createdAt))
  }

  async updateRole(id: number, role: UserRole, actorId: number): Promise<User> {
    if (id === actorId && role !== 'admin') {
      throw new BadRequestException('Нельзя понизить собственную роль admin')
    }
    const [user] = await this.db.update(users).set({ role, updatedAt: new Date() }).where(eq(users.id, id)).returning()
    if (!user) throw new NotFoundException('Пользователь не найден')

    await this.db.delete(refreshTokens).where(eq(refreshTokens.userId, id))

    return user
  }

  async updateTelegramChatId(userId: number, chatId: string | null): Promise<void> {
    await this.db.update(users).set({ telegramChatId: chatId, updatedAt: new Date() }).where(eq(users.id, userId))
  }
}
