export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex-col justify-between p-12 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center">
              <span className="text-slate-900 font-bold text-lg">A</span>
            </div>
            <span className="text-white font-semibold text-xl">Arthora</span>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <blockquote className="space-y-3">
            <p className="text-2xl font-medium text-white leading-relaxed">
              "Wealth in motion."
            </p>
            <footer className="text-slate-400 text-sm">
              Gestão financeira inteligente para pessoas e empresas
            </footer>
          </blockquote>

          <div className="grid grid-cols-3 gap-4 pt-4">
            {[
              { label: "Receitas", color: "bg-green-500" },
              { label: "Despesas", color: "bg-red-400" },
              { label: "Metas", color: "bg-blue-400" },
            ].map((item) => (
              <div key={item.label} className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className={`w-2 h-2 rounded-full ${item.color} mb-2`} />
                <p className="text-white text-sm font-medium">{item.label}</p>
                <p className="text-slate-400 text-xs">Acompanhe tudo</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-slate-500 text-xs">
          © {new Date().getFullYear()} Arthora. Todos os direitos reservados.
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 bg-slate-900 dark:bg-white rounded-lg flex items-center justify-center">
              <span className="text-white dark:text-slate-900 font-bold">A</span>
            </div>
            <span className="font-semibold text-lg">Arthora</span>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
