<template>
  <div class="bg-muted/40 flex min-h-screen items-center justify-center p-4">
    <Card class="w-full max-w-md shadow-md">
      <CardHeader>
        <CardTitle class="text-center text-2xl"> Регистрация </CardTitle>
      </CardHeader>
      <CardContent>
        <form class="space-y-4" @submit.prevent="onSubmit">
          <VeeField v-slot="{ field, errors }" name="name">
            <Field :data-invalid="!!errors.length">
              <FieldLabel :for="field.name"> Имя </FieldLabel>
              <Input
                v-bind="field"
                :id="field.name"
                type="text"
                placeholder="Иван Иванов"
                :aria-invalid="!!errors.length"
              />
              <FieldError :errors="errors" />
            </Field>
          </VeeField>

          <VeeField v-slot="{ field, errors }" name="email">
            <Field :data-invalid="!!errors.length">
              <FieldLabel :for="field.name"> Email </FieldLabel>
              <Input
                v-bind="field"
                :id="field.name"
                type="email"
                placeholder="you@example.com"
                :aria-invalid="!!errors.length"
              />
              <FieldError :errors="errors" />
            </Field>
          </VeeField>

          <VeeField v-slot="{ field, errors }" name="password">
            <Field :data-invalid="!!errors.length">
              <FieldLabel :for="field.name"> Пароль </FieldLabel>
              <Input
                v-bind="field"
                :id="field.name"
                type="password"
                placeholder="Минимум 8 символов"
                :aria-invalid="!!errors.length"
              />
              <FieldError :errors="errors" />
            </Field>
          </VeeField>

          <Button type="submit" class="w-full" :disabled="isSubmitting">
            {{ isSubmitting ? 'Создание...' : 'Создать аккаунт' }}
          </Button>
        </form>

        <p class="text-muted-foreground mt-6 text-center text-sm">
          Уже есть аккаунт?
          <RouterLink to="/login" class="text-primary hover:underline"> Войти </RouterLink>
        </p>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { RegisterSchema } from '@repo/shared'
import { toTypedSchema } from '@vee-validate/zod'
import { Field as VeeField, useForm } from 'vee-validate'
import { RouterLink, useRoute, useRouter } from 'vue-router'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/entities/auth/model/auth.store'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const { handleSubmit, isSubmitting } = useForm({
  validationSchema: toTypedSchema(RegisterSchema),
})

const onSubmit = handleSubmit(async (values) => {
  await authStore.register(values)
  const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : null
  await router.push(redirect?.startsWith('/') ? redirect : '/')
})
</script>
