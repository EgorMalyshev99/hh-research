<script setup lang="ts">
import { Field as VeeField, useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { LoginSchema } from '@repo/shared'
import { useAuthStore } from '@/entities/auth/model/auth.store'
import { useRouter } from 'vue-router'

const router = useRouter()
const authStore = useAuthStore()

const fieldInputClass =
  'mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20'

const { handleSubmit, isSubmitting } = useForm({
  validationSchema: toTypedSchema(LoginSchema),
})

const onSubmit = handleSubmit(async (values) => {
  await authStore.login(values)
  await router.push('/')
})
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-slate-50">
    <div class="w-full max-w-md space-y-8 rounded-xl bg-white p-8 shadow">
      <div>
        <h2 class="text-center text-3xl font-bold text-slate-900">Вход</h2>
      </div>

      <form class="space-y-4" @submit.prevent="onSubmit">
        <VeeField v-slot="{ field, errors }" name="email">
          <div :data-invalid="errors.length > 0">
            <label class="block text-sm font-medium text-slate-700" :for="field.name">Email</label>
            <input
              v-bind="field"
              :id="field.name"
              type="email"
              :class="fieldInputClass"
              :aria-invalid="errors.length > 0"
              placeholder="you@example.com"
            />
            <ul v-if="errors.length" class="mt-1 list-disc space-y-0.5 pl-4 text-sm text-rose-600" role="alert">
              <li v-for="(msg, i) in errors" :key="i">{{ msg }}</li>
            </ul>
          </div>
        </VeeField>

        <VeeField v-slot="{ field, errors }" name="password">
          <div :data-invalid="errors.length > 0">
            <label class="block text-sm font-medium text-slate-700" :for="field.name">Пароль</label>
            <input
              v-bind="field"
              :id="field.name"
              type="password"
              :class="fieldInputClass"
              :aria-invalid="errors.length > 0"
              placeholder="••••••••"
            />
            <ul v-if="errors.length" class="mt-1 list-disc space-y-0.5 pl-4 text-sm text-rose-600" role="alert">
              <li v-for="(msg, i) in errors" :key="i">{{ msg }}</li>
            </ul>
          </div>
        </VeeField>

        <button
          type="submit"
          :disabled="isSubmitting"
          class="flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium
            text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
        >
          {{ isSubmitting ? 'Вход...' : 'Войти' }}
        </button>
      </form>

      <p class="text-center text-sm text-slate-600">
        Нет аккаунта?
        <RouterLink to="/register" class="text-violet-600 hover:text-violet-700 hover:underline">Зарегистрироваться</RouterLink>
      </p>
    </div>
  </div>
</template>
