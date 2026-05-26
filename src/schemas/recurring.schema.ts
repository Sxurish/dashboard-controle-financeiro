import { z } from 'zod'

export const recurringRuleSchema = z.object({
  description: z.string().min(1, 'Descrição é obrigatória').max(255),
  amount: z.number().positive('Valor deve ser positivo').max(999_999_999),
  type: z.enum(['income', 'expense']),
  category_id: z.string().uuid().nullable().optional(),
  account_id: z.string().uuid('Conta é obrigatória'),
  frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly', 'custom']),
  interval: z.number().int().min(1).max(365).optional(),
  start_date: z.string().min(1, 'Data de início é obrigatória'),
  end_date: z.string().nullable().optional(),
  day_of_month: z.number().int().min(1).max(31).nullable().optional(),
  auto_generate: z.boolean(),
})

export type RecurringRuleFormValues = z.infer<typeof recurringRuleSchema>
