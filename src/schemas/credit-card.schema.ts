import { z } from 'zod'

export const creditCardSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100),
  limit: z.number().positive('Limite deve ser positivo').max(999_999_999),
  closing_day: z.number().int().min(1).max(31),
  due_day: z.number().int().min(1).max(31),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).nullable().optional(),
  brand: z.string().max(50).nullable().optional(),
})

export type CreditCardFormValues = z.infer<typeof creditCardSchema>
