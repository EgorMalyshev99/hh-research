export const queryKeys = {
  root: ['job-research'] as const,
  llm: {
    all: () => [...queryKeys.root, 'llm'] as const,
    status: () => [...queryKeys.llm.all(), 'status'] as const,
  },
  vacancies: {
    all: () => [...queryKeys.root, 'vacancies'] as const,
    list: (filters: Record<string, unknown> = {}) => [...queryKeys.vacancies.all(), 'list', filters] as const,
  },
  myVacancies: {
    all: () => [...queryKeys.root, 'my-vacancies'] as const,
    list: () => [...queryKeys.myVacancies.all(), 'list'] as const,
  },
  blacklist: {
    all: () => [...queryKeys.root, 'blacklist'] as const,
    list: () => [...queryKeys.blacklist.all(), 'list'] as const,
  },
  history: {
    all: () => [...queryKeys.root, 'history'] as const,
    list: () => [...queryKeys.history.all(), 'list'] as const,
  },
  stats: {
    all: () => [...queryKeys.root, 'stats'] as const,
    summary: () => [...queryKeys.stats.all(), 'summary'] as const,
  },
  resumes: {
    all: () => [...queryKeys.root, 'resumes'] as const,
    list: () => [...queryKeys.resumes.all(), 'list'] as const,
  },
  import: {
    all: () => [...queryKeys.root, 'import'] as const,
    providers: () => [...queryKeys.import.all(), 'providers'] as const,
  },
  adminUsers: {
    all: () => [...queryKeys.root, 'admin-users'] as const,
    list: () => [...queryKeys.adminUsers.all(), 'list'] as const,
  },
}
