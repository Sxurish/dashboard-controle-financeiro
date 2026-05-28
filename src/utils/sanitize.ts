/**
 * Converts empty-string values to null in an object. Useful before sending
 * form data to Postgres, where an empty string "" sent to a nullable
 * `date`/`uuid`/`numeric` column raises an "invalid input syntax" error.
 */
export function emptyStringsToNull<T extends Record<string, unknown>>(obj: T): T {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    result[key] = value === '' ? null : value
  }
  return result as T
}
