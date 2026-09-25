// Sede storica della casa costruttrice, mostrata sopra il titolo nelle card come nel design Stitch.
const SEDI: Record<string, string> = {
  porsche: 'Stoccarda, Germania',
  ferrari: 'Maranello, Italia',
  lamborghini: "Sant'Agata Bolognese, Italia",
  maserati: 'Modena, Italia',
  'alfa romeo': 'Arese, Italia',
  'aston martin': 'Gaydon, Regno Unito',
  bentley: 'Crewe, Regno Unito',
  'rolls-royce': 'Goodwood, Regno Unito',
  mclaren: 'Woking, Regno Unito',
  'land rover': 'Solihull, Regno Unito',
  lotus: 'Hethel, Regno Unito',
  'mercedes-benz': 'Stoccarda, Germania',
  bmw: 'Monaco di Baviera, Germania',
  audi: 'Ingolstadt, Germania',
  bugatti: 'Molsheim, Francia',
  cadillac: 'Detroit, Stati Uniti',
  pontiac: 'Detroit, Stati Uniti',
  lucid: 'Newark, Stati Uniti',
  tesla: 'Austin, Stati Uniti',
}

export const sedeMarca = (marca: string): string | null => SEDI[marca.trim().toLowerCase()] ?? null
