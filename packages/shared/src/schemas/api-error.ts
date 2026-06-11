import { z } from 'zod'

export const ApiErrorSchema = z.object({
  statusCode: z.number(),
  message: z.union([z.string(), z.array(z.string())]),
  requestId: z.string().optional(),
  code: z.string().optional(),
  formErrors: z.array(z.string()).optional(),
  fieldErrors: z.record(z.array(z.string())).optional(),
})

export type ApiErrorDto = z.infer<typeof ApiErrorSchema>
