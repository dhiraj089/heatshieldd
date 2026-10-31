import Link from 'next/link'
import { ArrowLeft, Compass } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center p-6 text-[var(--color-ink)]">
      <div className="max-w-md w-full bg-[var(--color-surface)] border-[1.5px] border-[var(--color-ink)] rounded-[12px] p-8 shadow-[4px_4px_0_#101010] text-center flex flex-col items-center">
        <div className="w-16 h-16 rounded-full bg-[var(--color-bg-soft)] border-[1.5px] border-[var(--color-ink)] flex items-center justify-center text-[var(--color-primary)] mb-5">
          <Compass size={32} />
        </div>
        <div className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[var(--color-primary)] mb-2">
          404 · Zone Not Found
        </div>
        <h1 className="text-3xl font-black tracking-tight text-[var(--color-ink)] mb-3 font-heading">
          Lost in Thane?
        </h1>
        <p className="text-xs text-[var(--color-ink-muted)] leading-relaxed mb-6">
          The requested coordinate or civic telemetry stream is not available in our 18-ward monitoring registry.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-[8px] bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--color-surface)] text-xs font-bold uppercase tracking-[0.08em] border-[1.5px] border-[var(--color-ink)] shadow-[3px_3px_0_#101010] transition-all hover:translate-x-[-1px] hover:translate-y-[-1px]"
        >
          <ArrowLeft size={16} />
          <span>Return to HeatShield</span>
        </Link>
      </div>
    </div>
  )
}
