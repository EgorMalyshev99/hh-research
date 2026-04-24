import { z } from 'zod'

export const ResumeSchema = z.object({
  id: z.number(),
  userId: z.number(),
  title: z.string().min(1).max(255),
  skills: z.string().min(1),
  experienceSummary: z.string().min(1),
  experienceYears: z.number().int().min(0).max(80),
  education: z.string().nullable(),
  desiredSalary: z.number().int().positive().nullable(),
  desiredSalaryCurrency: z.string().min(1).max(16).nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export const ResumeInputSchema = ResumeSchema.pick({
  title: true,
  skills: true,
  experienceSummary: true,
  experienceYears: true,
  education: true,
  desiredSalary: true,
  desiredSalaryCurrency: true,
})

export type Resume = z.infer<typeof ResumeSchema>
export type ResumeInput = z.infer<typeof ResumeInputSchema>
