import { format, parseISO, startOfMonth, endOfMonth, subMonths, isAfter, isBefore, differenceInDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function formatDate(date: string | Date, pattern = 'dd/MM/yyyy'): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, pattern, { locale: ptBR })
}

export function formatDateShort(date: string | Date): string {
  return formatDate(date, 'dd MMM')
}

export function formatMonth(date: string | Date): string {
  return formatDate(date, 'MMMM yyyy')
}

export function formatMonthShort(date: string | Date): string {
  return formatDate(date, 'MMM/yy')
}

export function getCurrentMonthRange(): { start: string; end: string } {
  const now = new Date()
  return {
    start: format(startOfMonth(now), 'yyyy-MM-dd'),
    end: format(endOfMonth(now), 'yyyy-MM-dd'),
  }
}

export function getMonthRange(year: number, month: number): { start: string; end: string } {
  const date = new Date(year, month - 1, 1)
  return {
    start: format(startOfMonth(date), 'yyyy-MM-dd'),
    end: format(endOfMonth(date), 'yyyy-MM-dd'),
  }
}

export function getPreviousMonthRange(): { start: string; end: string } {
  const prev = subMonths(new Date(), 1)
  return {
    start: format(startOfMonth(prev), 'yyyy-MM-dd'),
    end: format(endOfMonth(prev), 'yyyy-MM-dd'),
  }
}

export function getDaysUntilDue(dueDate: string): number {
  return differenceInDays(parseISO(dueDate), new Date())
}

export function isOverdue(dueDate: string): boolean {
  return isBefore(parseISO(dueDate), new Date())
}

export function getMonthOptions(): { value: number; label: string }[] {
  return Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: format(new Date(2024, i, 1), 'MMMM', { locale: ptBR }),
  }))
}

export function getYearOptions(yearsBack = 5): { value: number; label: string }[] {
  const currentYear = new Date().getFullYear()
  return Array.from({ length: yearsBack + 2 }, (_, i) => ({
    value: currentYear - yearsBack + i,
    label: String(currentYear - yearsBack + i),
  }))
}

export function toISODateString(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}
