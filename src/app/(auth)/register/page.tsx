import { RegisterForm } from "@/components/shared/auth/register-form"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Criar conta" }

export default function RegisterPage() {
  return <RegisterForm />
}
