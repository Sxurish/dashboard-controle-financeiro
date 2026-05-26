import { z } from 'zod'

export const transactionSchema = z.object({
  description: z.string().min(1, 'Descrição é obrigatória').max(255),
  amount: z.number().positive('Valor deve ser positivo').max(999_999_999),
  type: z.enum(['income', 'expense', 'transfer']),
  category_id: z.string().uuid().nullable().optional(),
  account_id: z.string().uuid('Conta é obrigatória'),
  credit_card_id: z.string().uuid().nullable().optional(),
  date: z.string().min(1, 'Data é obrigatória'),
  due_date: z.string().nullable().optional(),
  status: z.enum(['paid', 'pending', 'overdue']),
  payment_method: z.enum(['pix', 'credit_card', 'debit_card', 'cash', 'bank_transfer', 'other']).nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
  is_installment: z.boolean().optional(),
  installment_count: z.number().int().min(2).max(360).optional(),
  transfer_account_id: z.string().uuid().nullable().optional(),
})
  .refine(
    (data) => data.type !== 'transfer' || !!data.transfer_account_id,
    { message: 'Conta destino é obrigatória para transferências', path: ['transfer_account_id'] }
  )
  .refine(
    (data) => !data.is_installment || (data.installment_count && data.installment_count >= 2),
    { message: 'Número de parcelas deve ser pelo menos 2', path: ['installment_count'] }
  )

export type TransactionFormValues = z.infer<typeof transactionSchema>
