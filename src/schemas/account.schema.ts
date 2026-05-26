import { z } from 'zod'

export const accountSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100),
  type: z.enum(['bank', 'cash', 'digital', 'savings', 'investment', 'credit']),
  balance: z.number().min(-999_999_999).max(999_999_999),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Cor inválida').nullable().optional(),
  icon: z.string().max(50).nullable().optional(),
})

export type AccountFormValues = z.infer<typeof accountSchema>
