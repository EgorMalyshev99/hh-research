export const queryKeys = {
  root: ['hh-research'] as const,
  llm: {
    all: () => [...queryKeys.root, 'llm'] as const,
    status: () => [...queryKeys.llm.all(), 'status'] as const,
  },
  settings: {
    all: () => [...queryKeys.root, 'settings'] as const,
    me: () => [...queryKeys.settings.all(), 'me'] as const,
  },
  vacancies: {
    all: () => [...queryKeys.root, 'vacancies'] as const,
    list: () => [...queryKeys.vacancies.all(), 'list'] as const,
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
  hh: {
    all: () => [...queryKeys.root, 'hh'] as const,
    areas: () => [...queryKeys.hh.all(), 'areas'] as const,
  },
}
