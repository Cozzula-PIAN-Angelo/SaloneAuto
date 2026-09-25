import { Link } from 'react-router-dom'

export default function Logo({ className = 'text-xl', onClick }: { className?: string; onClick?: () => void }) {
  return (
    <Link
      to="/"
      onClick={onClick}
      className={`group flex items-center gap-2 font-display font-bold tracking-widest whitespace-nowrap text-ink ${className}`}
    >
      <span className="mb-0.5 inline-block h-2 w-2 rounded-full bg-gold transition-transform group-hover:scale-125" />
      SALONE AUTO
    </Link>
  )
}
