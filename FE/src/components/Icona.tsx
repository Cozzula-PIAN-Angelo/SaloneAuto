/** Icona Material Symbols (stesso set del design Stitch). `nome` è il nome del glifo, es. "favorite". */
export default function Icona({ nome, piena = false, className = '' }: { nome: string; piena?: boolean; className?: string }) {
  return (
    <span className={`material-symbols-outlined ${piena ? 'piena' : ''} ${className}`} aria-hidden="true">
      {nome}
    </span>
  )
}
