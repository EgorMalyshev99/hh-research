import { ResumeSchema } from '@repo/shared'
import { useQuery } from '@tanstack/vue-query'
import { z } from 'zod'

import { api } from '@/shared/api/http'
import { queryKeys } from '@/shared/lib/query-keys'

const ResumeListSchema = z.array(ResumeSchema)

export const fetchResumes = async () => {
  const { data } = await api.get<unknown>('/resumes')
  return ResumeListSchema.parse(data)
}

export const useResumesQuery = () =>
  useQuery({
    queryKey: queryKeys.resumes.list(),
    queryFn: fetchResumes,
  })
