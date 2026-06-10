/** Origins для CORS: явный CSV или dashboard + landing. */
export function resolveCorsOrigins(dashboardUrl: string, landingUrl: string, corsOriginsCsv?: string): string[] {
  if (corsOriginsCsv?.trim()) {
    return corsOriginsCsv
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean)
  }

  return [dashboardUrl, landingUrl]
}
