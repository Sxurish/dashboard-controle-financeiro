export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Left panel - Kaivo brand */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden" style={{ background: '#0A0A0A' }}>
        {/* Background gradient orbs */}
        <div
          className="absolute top-0 left-0 w-[500px] h-[500px] -translate-x-1/3 -translate-y-1/3 pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(255,107,0,0.18) 0%, rgba(233,30,140,0.12) 40%, transparent 70%)' }}
        />
        <div
          className="absolute bottom-0 right-0 w-[400px] h-[400px] translate-x-1/4 translate-y-1/4 pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(123,47,190,0.20) 0%, rgba(233,30,140,0.10) 40%, transparent 70%)' }}
        />

        {/* Top logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #FF6B00, #E91E8C, #7B2FBE)' }}
          >
            <svg viewBox="0 0 100 100" className="w-6 h-6" fill="none">
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
              className="font-bold text-2xl tracking-tight"
              style={{
                background: 'linear-gradient(135deg, #FF6B00, #E91E8C, #7B2FBE)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              kaivo
            </span>
            <span className="text-[10px] tracking-widest uppercase" style={{ color: '#555' }}>by HSB Company</span>
          </div>
        </div>

        {/* Center branding */}
        <div className="relative z-10 space-y-6">
          {/* Large K icon */}
          <svg viewBox="0 0 100 100" width="72" height="72" fill="none">
            <defs>
              <linearGradient id="kg-auth" x1="5" y1="5" x2="95" y2="95" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#FF6B00" />
                <stop offset="50%" stopColor="#E91E8C" />
                <stop offset="100%" stopColor="#7B2FBE" />
              </linearGradient>
            </defs>
            <path d="M22 12L22 86" stroke="url(#kg-auth)" strokeWidth="11" strokeLinecap="round" />
            <path d="M22 36L80 10" stroke="url(#kg-auth)" strokeWidth="9" strokeLinecap="round" />
            <path d="M22 50L56 30" stroke="url(#kg-auth)" strokeWidth="8" strokeLinecap="round" />
            <path d="M22 50L56 70" stroke="url(#kg-auth)" strokeWidth="8" strokeLinecap="round" />
            <path d="M22 64L80 90" stroke="url(#kg-auth)" strokeWidth="9" strokeLinecap="round" />
            <circle cx="80" cy="10" r="6" fill="url(#kg-auth)" />
            <circle cx="80" cy="90" r="6" fill="url(#kg-auth)" />
            <circle cx="22" cy="88" r="5" fill="url(#kg-auth)" />
          </svg>

          <div className="space-y-2">
            <p
              className="text-lg font-semibold tracking-[0.2em] uppercase"
              style={{
                background: 'linear-gradient(135deg, #FF6B00, #E91E8C, #7B2FBE)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Financial Intelligence
            </p>
            <h2 className="text-4xl font-bold text-white leading-tight">
              Clareza financeira<br />para decisões<br />mais inteligentes.
            </h2>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-2">
            {[
              { label: 'Receitas', desc: 'Acompanhe tudo', color: '#22c55e' },
              { label: 'Despesas', desc: 'Sob controle', color: '#ef4444' },
              { label: 'Metas', desc: 'Sempre evoluindo', color: '#E91E8C' },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl p-4 border"
                style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' }}
              >
                <div className="w-2 h-2 rounded-full mb-2" style={{ background: item.color }} />
                <p className="text-white text-sm font-medium">{item.label}</p>
                <p className="text-xs" style={{ color: '#666' }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-xs flex items-center gap-1" style={{ color: '#444' }}>
          © {new Date().getFullYear()} Kaivo · um produto{' '}
          <a
            href="https://hsbcompany.com.br"
            target="_blank"
            rel="noopener noreferrer"
            className="text-neutral-500 hover:text-neutral-300 transition-colors hover:underline underline-offset-2"
          >
            HSB Company
          </a>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #FF6B00, #E91E8C, #7B2FBE)' }}
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
                className="font-bold text-lg tracking-tight"
                style={{
                  background: 'linear-gradient(135deg, #FF6B00, #E91E8C, #7B2FBE)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                kaivo
              </span>
              <span className="text-[9px] text-muted-foreground tracking-widest uppercase">by HSB Company</span>
            </div>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
