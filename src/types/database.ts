export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; full_name: string | null; avatar_url: string | null; currency: string; locale: string; created_at: string; updated_at: string }
        Insert: { id: string; full_name?: string | null; avatar_url?: string | null; currency?: string; locale?: string; created_at?: string; updated_at?: string }
        Update: { id?: string; full_name?: string | null; avatar_url?: string | null; currency?: string; locale?: string; updated_at?: string }
        Relationships: []
      }
      accounts: {
        Row: { id: string; user_id: string; name: string; type: 'bank' | 'cash' | 'digital' | 'savings' | 'investment' | 'credit'; balance: number; color: string | null; icon: string | null; is_active: boolean; created_at: string; updated_at: string }
        Insert: { id?: string; user_id: string; name: string; type: 'bank' | 'cash' | 'digital' | 'savings' | 'investment' | 'credit'; balance?: number; color?: string | null; icon?: string | null; is_active?: boolean; created_at?: string; updated_at?: string }
        Update: { id?: string; user_id?: string; name?: string; type?: 'bank' | 'cash' | 'digital' | 'savings' | 'investment' | 'credit'; balance?: number; color?: string | null; icon?: string | null; is_active?: boolean; updated_at?: string }
        Relationships: []
      }
      categories: {
        Row: { id: string; user_id: string | null; name: string; type: 'income' | 'expense'; color: string; icon: string; created_at: string; updated_at: string }
        Insert: { id?: string; user_id?: string | null; name: string; type: 'income' | 'expense'; color?: string; icon?: string; created_at?: string; updated_at?: string }
        Update: { id?: string; user_id?: string | null; name?: string; type?: 'income' | 'expense'; color?: string; icon?: string; updated_at?: string }
        Relationships: []
      }
      transactions: {
        Row: { id: string; user_id: string; description: string; amount: number; type: 'income' | 'expense' | 'transfer'; category_id: string | null; account_id: string; credit_card_id: string | null; installment_group_id: string | null; installment_number: number | null; installment_total: number | null; recurring_rule_id: string | null; date: string; due_date: string | null; status: 'paid' | 'pending' | 'overdue'; payment_method: 'pix' | 'credit_card' | 'debit_card' | 'cash' | 'bank_transfer' | 'other' | null; notes: string | null; transfer_account_id: string | null; is_deleted: boolean; created_at: string; updated_at: string }
        Insert: { id?: string; user_id: string; description: string; amount: number; type: 'income' | 'expense' | 'transfer'; category_id?: string | null; account_id: string; credit_card_id?: string | null; installment_group_id?: string | null; installment_number?: number | null; installment_total?: number | null; recurring_rule_id?: string | null; date: string; due_date?: string | null; status?: 'paid' | 'pending' | 'overdue'; payment_method?: 'pix' | 'credit_card' | 'debit_card' | 'cash' | 'bank_transfer' | 'other' | null; notes?: string | null; transfer_account_id?: string | null; is_deleted?: boolean; created_at?: string; updated_at?: string }
        Update: { id?: string; user_id?: string; description?: string; amount?: number; type?: 'income' | 'expense' | 'transfer'; category_id?: string | null; account_id?: string; credit_card_id?: string | null; installment_group_id?: string | null; installment_number?: number | null; installment_total?: number | null; recurring_rule_id?: string | null; date?: string; due_date?: string | null; status?: 'paid' | 'pending' | 'overdue'; payment_method?: 'pix' | 'credit_card' | 'debit_card' | 'cash' | 'bank_transfer' | 'other' | null; notes?: string | null; transfer_account_id?: string | null; is_deleted?: boolean; updated_at?: string }
        Relationships: []
      }
      installment_groups: {
        Row: { id: string; user_id: string; description: string; total_amount: number; installment_count: number; created_at: string }
        Insert: { id?: string; user_id: string; description: string; total_amount: number; installment_count: number; created_at?: string }
        Update: { id?: string; description?: string; total_amount?: number; installment_count?: number }
        Relationships: []
      }
      recurring_rules: {
        Row: { id: string; user_id: string; description: string; amount: number; type: 'income' | 'expense'; category_id: string | null; account_id: string; frequency: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom'; interval: number; start_date: string; end_date: string | null; day_of_month: number | null; last_generated: string | null; is_active: boolean; auto_generate: boolean; created_at: string; updated_at: string }
        Insert: { id?: string; user_id: string; description: string; amount: number; type: 'income' | 'expense'; category_id?: string | null; account_id: string; frequency: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom'; interval?: number; start_date: string; end_date?: string | null; day_of_month?: number | null; last_generated?: string | null; is_active?: boolean; auto_generate?: boolean; created_at?: string; updated_at?: string }
        Update: { id?: string; description?: string; amount?: number; type?: 'income' | 'expense'; category_id?: string | null; account_id?: string; frequency?: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom'; interval?: number; start_date?: string; end_date?: string | null; day_of_month?: number | null; last_generated?: string | null; is_active?: boolean; auto_generate?: boolean; updated_at?: string }
        Relationships: []
      }
      credit_cards: {
        Row: { id: string; user_id: string; name: string; limit: number; closing_day: number; due_day: number; color: string | null; brand: string | null; is_active: boolean; created_at: string; updated_at: string }
        Insert: { id?: string; user_id: string; name: string; limit: number; closing_day: number; due_day: number; color?: string | null; brand?: string | null; is_active?: boolean; created_at?: string; updated_at?: string }
        Update: { id?: string; name?: string; limit?: number; closing_day?: number; due_day?: number; color?: string | null; brand?: string | null; is_active?: boolean; updated_at?: string }
        Relationships: []
      }
      credit_card_invoices: {
        Row: { id: string; credit_card_id: string; user_id: string; reference_month: string; total_amount: number; status: 'open' | 'closed' | 'paid'; due_date: string; paid_at: string | null; created_at: string; updated_at: string }
        Insert: { id?: string; credit_card_id: string; user_id: string; reference_month: string; total_amount?: number; status?: 'open' | 'closed' | 'paid'; due_date: string; paid_at?: string | null; created_at?: string; updated_at?: string }
        Update: { id?: string; total_amount?: number; status?: 'open' | 'closed' | 'paid'; due_date?: string; paid_at?: string | null; updated_at?: string }
        Relationships: []
      }
      goals: {
        Row: { id: string; user_id: string; name: string; description: string | null; target_amount: number; current_amount: number; deadline: string | null; color: string | null; icon: string | null; is_completed: boolean; created_at: string; updated_at: string }
        Insert: { id?: string; user_id: string; name: string; description?: string | null; target_amount: number; current_amount?: number; deadline?: string | null; color?: string | null; icon?: string | null; is_completed?: boolean; created_at?: string; updated_at?: string }
        Update: { id?: string; name?: string; description?: string | null; target_amount?: number; current_amount?: number; deadline?: string | null; color?: string | null; icon?: string | null; is_completed?: boolean; updated_at?: string }
        Relationships: []
      }
      settings: {
        Row: { user_id: string; theme: 'light' | 'dark' | 'system'; start_day_of_month: number; default_account_id: string | null; notifications_enabled: boolean; updated_at: string }
        Insert: { user_id: string; theme?: 'light' | 'dark' | 'system'; start_day_of_month?: number; default_account_id?: string | null; notifications_enabled?: boolean; updated_at?: string }
        Update: { theme?: 'light' | 'dark' | 'system'; start_day_of_month?: number; default_account_id?: string | null; notifications_enabled?: boolean; updated_at?: string }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
