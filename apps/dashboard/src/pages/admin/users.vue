<template>
  <DefaultLayout>
    <h1 class="mb-6 text-2xl font-bold tracking-tight">Пользователи</h1>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Email</TableHead>
          <TableHead>Имя</TableHead>
          <TableHead>Роль</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow v-for="user in users" :key="user.id">
          <TableCell>{{ user.email }}</TableCell>
          <TableCell>{{ user.name }}</TableCell>
          <TableCell>
            <select
              :value="user.role"
              class="border-input bg-background rounded-md border px-2 py-1 text-sm"
              @change="onRoleChange(user.id, ($event.target as HTMLSelectElement).value)"
            >
              <option value="job_seeker">Соискатель</option>
              <option value="employer">Работодатель</option>
              <option value="admin">Админ</option>
            </select>
          </TableCell>
          <TableCell class="text-muted-foreground text-xs">{{ fmt(user.createdAt) }}</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </DefaultLayout>
</template>

<script setup lang="ts">
import type { UserRole } from '@repo/shared'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@repo/ui'
import { computed } from 'vue'
import { toast } from 'vue-sonner'

import { useAdminUsersQuery, useUpdateUserRoleMutation } from '@/entities/user'
import DefaultLayout from '@/widgets/default-layout/DefaultLayout.vue'

const { data } = useAdminUsersQuery()
const { mutateAsync: updateRole } = useUpdateUserRoleMutation()

const users = computed(() => data.value ?? [])

const fmt = (iso: string) => new Date(iso).toLocaleDateString('ru-RU')

async function onRoleChange(id: number, role: string) {
  await updateRole({ id, role: role as UserRole })
  toast.success('Роль обновлена')
}
</script>
