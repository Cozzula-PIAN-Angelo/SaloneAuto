// useGrouping 'always': in italiano Intl non raggruppa i numeri a 4 cifre (4200 invece di 4.200)
const numero = new Intl.NumberFormat('it-IT', { maximumFractionDigits: 0, useGrouping: 'always' })
const data = new Intl.DateTimeFormat('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' })

// "€ 139.900" come nel design Stitch (simbolo prima, niente decimali; spazio non separabile)
export const formatPrezzo = (v: number) => `€ ${numero.format(v)}`
export const formatKm = (v: number) => `${numero.format(v)} km`
export const formatData = (iso: string | null | undefined) => (iso ? data.format(new Date(iso)) : '—')
