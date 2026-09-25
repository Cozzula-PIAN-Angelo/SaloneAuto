# Salone Auto — Frontend

React + Vite + TypeScript + Tailwind CSS v4. Design: progetto Stitch "Salone Auto" (tema scuro, oro champagne `#C9A96E`,
Playfair Display + Inter, icone Material Symbols). I token del design system sono nel blocco `@theme` di `src/index.css`
(utility come `bg-surface`, `text-gold`, `border-line`); le immagini generate da Stitch sono in `public/img`.

## Avvio

```bash
npm install
npm run dev        # http://localhost:5173
```

Il backend Spring deve girare su `http://localhost:8080`: in sviluppo Vite inoltra `/api` e `/uploads`
al backend (vedi `vite.config.ts`), quindi non serve configurare il CORS. Per un backend su un'altra porta:
`BACKEND_URL=http://localhost:9090 npm run dev`.

`FRONTEND_URL` nel `.env` del backend deve restare `http://localhost:5173`: è la base dei link nelle mail.

## Struttura

```
src/
  api/          client fetch con JWT, tipi ricalcati sui DTO del backend, endpoint
  auth/         AuthContext (token in localStorage, utente da /api/me), RequireAuth
  preferiti/    stato condiviso dei preferiti (cuore sulle card)
  components/   Header, Footer, AutoCard, Paginazione, icone…
  pages/        home, catalogo, dettaglio, auth/, account/, admin/
  utils/        formattazione (€, km, date), filtri catalogo <-> query string
```

## Pagine

| Percorso | Accesso | Note |
| --- | --- | --- |
| `/` | pubblico | hero, ricerca rapida, ultimi arrivi |
| `/catalogo` | pubblico | filtri e ordinamento nella query string (link condivisibili) |
| `/auto/:id` | pubblico | galleria, preferiti, avviso di prezzo |
| `/accedi`, `/registrati`, `/password-dimenticata` | pubblico | |
| `/reset-password?token=` | pubblico | link della mail di reset |
| `/avvisi/disattiva?token=` | pubblico | link "disattiva" della mail di notifica prezzo |
| `/account/preferiti`, `/account/avvisi`, `/account/profilo` | utente loggato | pagina unica, scorre alla sezione |
| `/admin` | ADMIN | annunci, prezzo/stato rapidi, decodifica VIN, foto |
