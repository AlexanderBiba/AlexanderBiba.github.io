export function formatPostDate(dateString: string, locale: string = 'en-US'): string {
  const [year, month, day] = dateString.split('-').map(Number)

  // Expecting YYYY-MM-DD; fall back to raw string if unexpected.
  if (!year || !month || !day) return dateString

  const date = new Date(year, month - 1, day)
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}


