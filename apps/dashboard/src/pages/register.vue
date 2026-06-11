<template>
  <div class="bg-muted/40 flex min-h-screen items-center justify-center p-4">
    <Card class="w-full max-w-md shadow-md">
      <CardHeader class="space-y-4">
        <div class="flex justify-center">
          <SiteLogo size="md" priority />
        </div>
        <CardTitle class="text-center text-2xl"> Регистрация </CardTitle>
      </CardHeader>
      <CardContent>
        <form class="space-y-4" @submit.prevent="onSubmit">
          <VeeField v-slot="{ field, errors }" name="name">
            <Field :data-invalid="!!errors.length">
              <FieldLabel :for="field.name"> Имя </FieldLabel>
              <Input v-bind="field" :id="field.name" type="text" :aria-invalid="!!errors.length" />
              <FieldError :errors="errors" />
            </Field>
          </VeeField>

          <VeeField v-slot="{ field, errors }" name="email">
            <Field :data-invalid="!!errors.length">
              <FieldLabel :for="field.name"> Email </FieldLabel>
              <Input v-bind="field" :id="field.name" type="email" :aria-invalid="!!errors.length" />
              <FieldError :errors="errors" />
            </Field>
          </VeeField>

          <VeeField v-slot="{ field, errors }" name="password">
            <Field :data-invalid="!!errors.length">
              <FieldLabel :for="field.name"> Пароль </FieldLabel>
              <Input v-bind="field" :id="field.name" type="password" :aria-invalid="!!errors.length" />
              <div class="mt-2 flex flex-wrap gap-2">
                <Badge v-for="c in passwordCriteria" :key="c.id" :variant="c.met ? 'success' : 'destructive'">
                  {{ c.label }}
                </Badge>
              </div>
              <FieldError :errors="errors" />
            </Field>
          </VeeField>

          <VeeField v-slot="{ field, errors }" name="role">
            <Field :data-invalid="!!errors.length">
              <FieldLabel>Тип аккаунта</FieldLabel>
              <select
                :id="field.name"
                v-model="field.value"
                class="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
                @blur="field.onBlur"
              >
                <option value="job_seeker">Соискатель</option>
                <option value="employer">Работодатель</option>
              </select>
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
import { checkPasswordCriteria, RegisterSchema } from '@repo/shared'
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Field, FieldError, FieldLabel, Input } from '@repo/ui'
import { toTypedSchema } from '@vee-validate/zod'
import { Field as VeeField, useFieldValue, useForm } from 'vee-validate'
import { computed } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'

import { useAuthStore } from '@/entities/auth'
import { showApiMutationErrorToast } from '@/shared/lib/api-error'
import { SiteLogo } from '@/shared/ui'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const { handleSubmit, isSubmitting } = useForm({
  validationSchema: toTypedSchema(RegisterSchema),
  initialValues: { role: 'job_seeker' as const },
})

const passwordValue = useFieldValue<string>('password')
const passwordCriteria = computed(() => checkPasswordCriteria(passwordValue.value ?? ''))

const onSubmit = handleSubmit(async (values) => {
  try {
    await authStore.register(values)
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : null
    await router.push(redirect?.startsWith('/') ? redirect : '/')
  } catch (e) {
    showApiMutationErrorToast(e, 'Не удалось зарегистрироваться')
  }
})
</script>
