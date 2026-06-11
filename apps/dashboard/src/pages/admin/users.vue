<template>
  <DefaultLayout>
    <h1 class="mb-6 text-2xl font-bold tracking-tight">Пользователи</h1>

    <div v-if="isPending" class="text-muted-foreground text-sm">Загрузка…</div>
    <div v-else-if="isError" class="text-destructive text-sm">Не удалось загрузить список пользователей</div>
    <Table v-else>
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, toast } from '@repo/ui'
import { computed, watch } from 'vue'

import { useAdminUsersQuery, useUpdateUserRoleMutation } from '@/entities/user'
import DefaultLayout from '@/widgets/default-layout/DefaultLayout.vue'
import { showApiMutationErrorToast, showApiQueryErrorToast } from '@/shared/lib/api-error'

const { data, isPending, isError, error } = useAdminUsersQuery()
const { mutateAsync: updateRole } = useUpdateUserRoleMutation()

const users = computed(() => data.value ?? [])

watch(error, (e) => {
  if (e) showApiQueryErrorToast(e, 'Не удалось загрузить пользователей')
})

const fmt = (iso: string) => new Date(iso).toLocaleDateString('ru-RU')

async function onRoleChange(id: number, role: string) {
  try {
    await updateRole({ id, role: role as UserRole })
    toast.success('Роль обновлена')
  } catch (e) {
    showApiMutationErrorToast(e, 'Не удалось обновить роль')
  }
}
</script>
