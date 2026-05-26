import { z } from 'zod'

export const goalSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100),
  description: z.string().max(500).nullable().optional(),
  target_amount: z.number().positive('Valor alvo deve ser positivo').max(999_999_999),
  current_amount: z.number().min(0).max(999_999_999).optional(),
  deadline: z.string().nullable().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).nullable().optional(),
  icon: z.string().max(50).nullable().optional(),
})

export type GoalFormValues = z.infer<typeof goalSchema>
