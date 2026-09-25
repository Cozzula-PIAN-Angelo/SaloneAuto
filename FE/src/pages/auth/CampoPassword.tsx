import { useState, type InputHTMLAttributes, type ReactNode } from 'react'
import Icona from '../../components/Icona'
import { inputAuth, labelAuth } from './AuthLayout'

export default function CampoPassword({
  label,
  hint,
  children,
  ...input
}: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string; children?: ReactNode }) {
  const [visibile, setVisibile] = useState(false)
  const id = input.id ?? input.name
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className={labelAuth}>
          {label}
        </label>
        {hint && <span className="text-[10px] font-light text-muted">{hint}</span>}
      </div>
      <div className="group relative">
        <input {...input} id={id} type={visibile ? 'text' : 'password'} placeholder="••••••••" className={`${inputAuth} pr-11`} />
        <button
          type="button"
          onClick={() => setVisibile((v) => !v)}
          aria-label={visibile ? 'Nascondi password' : 'Mostra password'}
          className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-muted transition-colors hover:text-ink"
        >
          <Icona nome={visibile ? 'visibility_off' : 'visibility'} className="text-[18px]" />
        </button>
      </div>
      {children}
    </div>
  )
}
