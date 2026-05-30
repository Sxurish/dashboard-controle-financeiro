import Link from "next/link"

const GRADIENT = "linear-gradient(135deg, #FF6B00, #E91E8C, #7B2FBE)"

function KaivoLogo() {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: GRADIENT }}
      >
        <svg viewBox="0 0 100 100" className="w-[18px] h-[18px]" fill="none">
          <path d="M22 12L22 86" stroke="white" strokeWidth="12" strokeLinecap="round" />
          <path d="M22 36L78 10" stroke="white" strokeWidth="10" strokeLinecap="round" />
          <path d="M22 50L55 30" stroke="white" strokeWidth="8" strokeLinecap="round" />
          <path d="M22 50L55 70" stroke="white" strokeWidth="8" strokeLinecap="round" />
          <path d="M22 64L78 90" stroke="white" strokeWidth="10" strokeLinecap="round" />
          <circle cx="78" cy="10" r="7" fill="white" />
          <circle cx="78" cy="90" r="7" fill="white" />
          <circle cx="22" cy="87" r="5" fill="white" />
        </svg>
      </div>
      <div className="flex flex-col leading-none">
        <span
          className="text-lg font-bold tracking-tight"
          style={{
            background: GRADIENT,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          kaivo
        </span>
        <span className="text-[10px] text-neutral-500 font-medium tracking-wide">
          by HSB Company
        </span>
      </div>
    </div>
  )
}

function GradientButton({
  href,
  children,
  disabled,
}: {
  href?: string
  children: React.ReactNode
  disabled?: boolean
}) {
  if (disabled) {
    return (
      <button
        disabled
        className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white opacity-50 cursor-not-allowed"
        style={{ background: GRADIENT }}
      >
        {children}
      </button>
    )
  }
  return (
    <Link
      href={href ?? "#"}
      className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
      style={{ background: GRADIENT }}
    >
      {children}
    </Link>
  )
}

function OutlineButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white border border-white/20 hover:border-white/40 transition-colors"
    >
      {children}
    </Link>
  )
}

// ─── Navbar ──────────────────────────────────────────────────────────────────

function Navbar() {
  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-black/80 border-b border-white/5">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        <KaivoLogo />
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="px-4 py-2 text-sm font-medium text-neutral-300 hover:text-white transition-colors"
          >
            Entrar
          </Link>
          <GradientButton href="/register">Criar conta</GradientButton>
        </div>
      </div>
    </nav>
  )
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function MockDashboard() {
  const bars = [
    { h: 40, color: "#22c55e" },
    { h: 70, color: "#ef4444" },
    { h: 55, color: "#22c55e" },
    { h: 85, color: "#22c55e" },
    { h: 30, color: "#ef4444" },
    { h: 60, color: "#22c55e" },
    { h: 45, color: "#ef4444" },
  ]

  const transactions = [
    { icon: "↑", label: "Salário", amount: "+R$5.000", color: "#22c55e" },
    { icon: "↓", label: "Aluguel", amount: "-R$1.500", color: "#ef4444" },
    { icon: "↓", label: "Mercado", amount: "-R$380", color: "#ef4444" },
  ]

  return (
    <div className="rounded-2xl border border-white/5 bg-[#111] shadow-2xl overflow-hidden w-full max-w-2xl mx-auto">
      {/* Header row */}
      <div className="flex items-center gap-2 px-5 py-4 border-b border-white/5">
        <div className="w-3 h-3 rounded-full bg-[#FF6B00]" />
        <div className="w-3 h-3 rounded-full bg-[#E91E8C]" />
        <div className="w-3 h-3 rounded-full bg-[#7B2FBE]" />
        <span className="text-xs text-neutral-400 ml-2 font-medium">Kaivo Dashboard</span>
      </div>

      <div className="p-5 space-y-4">
        {/* KPI boxes */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-[#0d0d0d] rounded-xl p-3 border border-white/5">
            <p className="text-[10px] text-neutral-500 mb-1">Receitas</p>
            <p className="text-sm font-bold text-white">R$12.450</p>
            <span className="text-[10px] text-green-400 font-medium">+12%</span>
          </div>
          <div className="bg-[#0d0d0d] rounded-xl p-3 border border-white/5">
            <p className="text-[10px] text-neutral-500 mb-1">Despesas</p>
            <p className="text-sm font-bold text-white">R$7.890</p>
            <span className="text-[10px] text-red-400 font-medium">-3%</span>
          </div>
          <div className="bg-[#0d0d0d] rounded-xl p-3 border border-white/5">
            <p className="text-[10px] text-neutral-500 mb-1">Saldo</p>
            <p className="text-sm font-bold text-white">R$4.560</p>
            <span
              className="text-[10px] font-medium"
              style={{
                background: GRADIENT,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Positivo
            </span>
          </div>
        </div>

        {/* Bar chart */}
        <div className="bg-[#0d0d0d] rounded-xl p-3 border border-white/5">
          <p className="text-[10px] text-neutral-500 mb-3">Fluxo mensal</p>
          <div className="flex items-end gap-1.5 h-16">
            {bars.map((bar, i) => (
              <div
                key={i}
                className="flex-1 rounded-sm opacity-80"
                style={{ height: `${bar.h}%`, backgroundColor: bar.color }}
              />
            ))}
          </div>
        </div>

        {/* Recent transactions */}
        <div className="space-y-2">
          {transactions.map((tx, i) => (
            <div
              key={i}
              className="flex items-center justify-between bg-[#0d0d0d] rounded-xl px-3 py-2.5 border border-white/5"
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold"
                  style={{ color: tx.color, backgroundColor: `${tx.color}20` }}
                >
                  {tx.icon}
                </div>
                <span className="text-xs text-neutral-300">{tx.label}</span>
              </div>
              <span className="text-xs font-semibold" style={{ color: tx.color }}>
                {tx.amount}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function Hero() {
  return (
    <section className="relative bg-[#0A0A0A] overflow-hidden">
      {/* Subtle radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 40% at 50% -10%, rgba(255,107,0,0.08) 0%, transparent 70%)",
        }}
      />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-24 pb-16">
        <div className="flex flex-col items-center text-center space-y-8">
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold tracking-widest uppercase"
            style={{
              borderColor: "rgba(255,107,0,0.3)",
              background: "rgba(255,107,0,0.05)",
            }}
          >
            <span
              style={{
                background: GRADIENT,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              ✦ Financial Intelligence
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight max-w-3xl">
            Controle financeiro{" "}
            <span
              style={{
                background: GRADIENT,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              para quem leva
            </span>{" "}
            dinheiro a sério.
          </h1>

          {/* Subheading */}
          <p className="text-neutral-400 text-lg max-w-xl leading-relaxed">
            Receitas, despesas, metas e recorrências em um só lugar. Clareza total para
            decisões mais inteligentes.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <Link
              href="/register"
              className="px-8 py-3 rounded-xl text-base font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: GRADIENT }}
            >
              Começar grátis →
            </Link>
            <a
              href="#features"
              className="px-8 py-3 rounded-xl text-base font-semibold text-white border border-white/20 hover:border-white/40 transition-colors"
            >
              Ver funcionalidades
            </a>
          </div>

          {/* Trust line */}
          <div className="flex flex-wrap justify-center gap-5 text-sm text-neutral-400">
            <span>✓ Grátis para começar</span>
            <span>✓ Sem cartão de crédito</span>
            <span>✓ Dados seguros</span>
          </div>

          {/* Mock dashboard */}
          <div className="w-full mt-4">
            <MockDashboard />
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Features ─────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: "💸",
    title: "Lançamentos",
    desc: "Receitas, despesas e transferências organizadas com filtros avançados.",
  },
  {
    icon: "🔄",
    title: "Recorrências",
    desc: "Automatize contas fixas e receitas mensais. Nunca esqueça um pagamento.",
  },
  {
    icon: "🎯",
    title: "Metas",
    desc: "Defina objetivos e acompanhe seu progresso rumo à independência financeira.",
  },
  {
    icon: "📊",
    title: "Relatórios",
    desc: "Gráficos e análises detalhadas do seu dinheiro ao longo do tempo.",
  },
  {
    icon: "💳",
    title: "Cartões",
    desc: "Controle seu crédito, acompanhe faturas e evite surpresas no final do mês.",
  },
  {
    icon: "🏦",
    title: "Contas",
    desc: "Gerencie múltiplas contas bancárias em um painel centralizado.",
  },
]

function Features() {
  return (
    <section id="features" className="bg-[#080808] py-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Section header */}
        <div className="text-center mb-14 space-y-3">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
            Tudo que você precisa
          </h2>
          <p className="text-neutral-400 text-lg max-w-lg mx-auto">
            Ferramentas completas para você ter clareza total das suas finanças.
          </p>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-white/5 bg-[#111] p-6 flex flex-col gap-4 hover:border-white/10 transition-colors"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                style={{ background: GRADIENT }}
              >
                {f.icon}
              </div>
              <div>
                <h3 className="text-base font-semibold text-white mb-1">{f.title}</h3>
                <p className="text-sm text-neutral-400 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Stats ────────────────────────────────────────────────────────────────────

function Stats() {
  return (
    <section className="relative py-16 bg-[#0A0A0A]">
      {/* Gradient border top */}
      <div className="absolute top-0 inset-x-0 h-px" style={{ background: GRADIENT }} />
      {/* Gradient border bottom */}
      <div className="absolute bottom-0 inset-x-0 h-px" style={{ background: GRADIENT }} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
          {[
            { value: "R$0", label: "para começar" },
            { value: "17+", label: "funcionalidades" },
            { value: "100%", label: "dados seguros" },
          ].map((stat) => (
            <div key={stat.label} className="flex flex-col items-center gap-1">
              <span
                className="text-3xl font-extrabold"
                style={{
                  background: GRADIENT,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                {stat.value}
              </span>
              <span className="text-neutral-400 text-sm">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Pricing ──────────────────────────────────────────────────────────────────

const FREE_FEATURES = [
  "Lançamentos ilimitados",
  "Até 3 contas",
  "Relatórios básicos",
  "Metas financeiras",
  "Recorrências",
]

const PRO_FEATURES = [
  "Tudo do plano Grátis",
  "Contas ilimitadas",
  "Importação OFX/CSV",
  "Relatórios avançados",
  "Suporte prioritário",
  "Cartões ilimitados",
  "Exportação de dados",
  "Badge by HSB Company",
]

function CheckIcon() {
  return (
    <svg
      className="w-4 h-4 flex-shrink-0"
      style={{
        background: GRADIENT,
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
      }}
      fill="none"
      viewBox="0 0 16 16"
    >
      <path
        d="M3 8l3.5 3.5L13 4.5"
        stroke="url(#grad)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <defs>
        <linearGradient id="grad" x1="0" y1="0" x2="16" y2="16" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FF6B00" />
          <stop offset="0.5" stopColor="#E91E8C" />
          <stop offset="1" stopColor="#7B2FBE" />
        </linearGradient>
      </defs>
    </svg>
  )
}

function Pricing() {
  return (
    <section id="pricing" className="py-24 bg-[#080808]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-14 space-y-3">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
            Simples e transparente
          </h2>
          <p className="text-neutral-400 text-lg">
            Comece grátis. Evolua quando precisar.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Free */}
          <div className="rounded-2xl border border-white/10 bg-[#111] p-8 flex flex-col">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-white mb-1">Grátis</h3>
              <div className="flex items-end gap-1">
                <span className="text-4xl font-extrabold text-white">R$0</span>
                <span className="text-neutral-400 text-sm mb-1">/mês</span>
              </div>
            </div>
            <ul className="space-y-3 flex-1 mb-8">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-3">
                  <CheckIcon />
                  <span className="text-sm text-neutral-300">{f}</span>
                </li>
              ))}
            </ul>
            <OutlineButton href="/register">Criar conta grátis</OutlineButton>
          </div>

          {/* Pro */}
          <div
            className="rounded-2xl bg-[#131313] p-8 flex flex-col relative overflow-hidden"
            style={{ boxShadow: "0 0 0 1.5px #E91E8C40, 0 8px 40px rgba(233,30,140,0.1)" }}
          >
            {/* Gradient border via absolute overlay */}
            <div
              className="absolute inset-0 rounded-2xl pointer-events-none"
              style={{
                background: "transparent",
                outline: "1.5px solid transparent",
                backgroundImage: GRADIENT,
                WebkitMask:
                  "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                WebkitMaskComposite: "xor",
                maskComposite: "exclude",
                padding: "1.5px",
              }}
            />

            {/* EM BREVE badge */}
            <div className="absolute top-5 right-5">
              <span
                className="text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full text-white"
                style={{ background: GRADIENT }}
              >
                Em breve
              </span>
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-bold text-white mb-1">Pro</h3>
              <div className="flex items-end gap-1">
                <span className="text-4xl font-extrabold text-white">R$29,90</span>
                <span className="text-neutral-400 text-sm mb-1">/mês</span>
              </div>
            </div>
            <ul className="space-y-3 flex-1 mb-8">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-3">
                  <CheckIcon />
                  <span className="text-sm text-neutral-300">{f}</span>
                </li>
              ))}
            </ul>
            <GradientButton disabled>Em breve</GradientButton>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Final CTA ────────────────────────────────────────────────────────────────

function FinalCTA() {
  return (
    <section className="bg-[#0A0A0A] py-28 text-center relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 100%, rgba(123,47,190,0.12) 0%, transparent 70%)",
        }}
      />
      <div className="relative max-w-2xl mx-auto px-4 sm:px-6 space-y-6">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
          Pronto para ter clareza financeira?
        </h2>
        <p className="text-neutral-400 text-lg">
          Junte-se a quem já controla o dinheiro com inteligência. Comece hoje, de graça.
        </p>
        <div className="pt-2">
          <Link
            href="/register"
            className="inline-flex px-8 py-4 rounded-xl text-base font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: GRADIENT }}
          >
            Criar minha conta gratuitamente →
          </Link>
        </div>
      </div>
    </section>
  )
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="bg-[#080808] border-t border-white/5 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8">
          {/* Left: logo + tagline */}
          <div className="flex flex-col gap-2">
            <KaivoLogo />
            <p className="text-xs text-neutral-500 ml-10">
              Financial Intelligence · by HSB Company
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-wrap gap-5 text-sm text-neutral-400">
            <Link href="/login" className="hover:text-white transition-colors">
              Entrar
            </Link>
            <Link href="/register" className="hover:text-white transition-colors">
              Criar conta
            </Link>
            <a
              href="https://hsbcompany.com.br"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              hsbcompany.com.br
            </a>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/5 text-center text-xs text-neutral-600">
          © 2025 Kaivo · Desenvolvido por HSB Company
        </div>
      </div>
    </footer>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="bg-[#0A0A0A] min-h-screen">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <Stats />
        <Pricing />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  )
}
