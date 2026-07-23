export function logApiCall(args: Record<string, unknown>): void {
  console.log('[letter]', args.stage ?? args.vendor ?? 'call', args.extra ?? '')
}
export function logApiError(ctx: Record<string, unknown>, e: unknown): void {
  console.error('[letter:error]', ctx, e instanceof Error ? e.message : e)
}
