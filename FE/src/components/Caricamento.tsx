export default function Caricamento({ testo = 'Caricamento…' }: { testo?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24" role="status">
      <span className="h-7 w-7 animate-spin rounded-full border border-line-strong border-t-gold" />
      <span className="text-[11px] font-semibold tracking-[0.18em] text-muted uppercase">{testo}</span>
    </div>
  )
}
