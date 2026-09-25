# Salone Auto — Backend

API REST del mini salone auto: catalogo pubblico, preferiti, avvisi di calo prezzo via email,
gestione annunci per l'amministratore.

**Stack:** Java 21, Spring Boot 4.1, Spring Security + JWT (JJWT), Spring Data JPA, PostgreSQL,
Spring Mail (SMTP) con template Thymeleaf, Lombok. Decodifica VIN con [Auto.dev](https://docs.auto.dev). Test d'integrazione con MockMvc su H2.

## Avvio

1. Crea il database `salone_auto` su PostgreSQL.
2. Copia `.env.example` in `.env` e compila i valori (DB, SMTP, `JWT_SECRET` di almeno 32 caratteri,
   `ADMIN_EMAIL`/`ADMIN_PASSWORD` per l'amministratore iniziale, `AUTODEV_API_KEY` per la
   decodifica VIN). Il file `.env` non va committato.
3. `mvn spring-boot:run`

Per Gmail: `MAIL_HOST=smtp.gmail.com`, porta 587, `MAIL_PASSWORD` = una *password per le app*.

Test: `mvn test`

## Account admin di prova

Con i valori di `.env.example` il backend crea al primo avvio questo amministratore:

| Email | Password |
|---|---|
| `admin.test@salone.local` | `Salone-b6JA5qKo` |

Dal frontend: accedi su `/accedi` e si apre il pannello `/admin`. Per un utente normale basta
registrarsi da `/registrati`.

## Ruoli

- **Visitatore**: cerca e consulta gli annunci pubblicati.
- **USER** (chi si registra): in più preferiti, avvisi di prezzo, profilo.
- **ADMIN**: crea e modifica annunci, prezzo, bozza/pubblicato, immagini. Viene creato solo
  all'avvio da `ADMIN_EMAIL`/`ADMIN_PASSWORD`: la registrazione crea sempre un USER.

## Endpoint

Autenticazione con header `Authorization: Bearer <token>`.

| Metodo | Path | Accesso | Body / parametri |
|---|---|---|---|
| POST | `/api/auth/registrazione` | pubblico | `nome, cognome, email, password` |
| POST | `/api/auth/login` | pubblico | `email, password` → `{token}` |
| POST | `/api/auth/password-dimenticata` | pubblico | `email` (risposta sempre uguale) |
| POST | `/api/auth/reset-password` | pubblico | `token, nuovaPassword` |
| GET / PUT | `/api/me` | loggato | PUT: `nome, cognome` |
| GET | `/api/auto` | pubblico | `q, marca, modello, annoMin, annoMax, carburante, condizione, prezzoMin, prezzoMax, kmMax, ordinaPer (prezzo\|km\|data\|titolo\|anno), direzione (asc\|desc), pagina, dimensione (max 50)` |
| GET | `/api/auto/{id}` | pubblico | |
| GET | `/api/admin/auto` | ADMIN | come sopra + `stato` (BOZZA\|PUBBLICATO) |
| GET | `/api/admin/auto/{id}` | ADMIN | |
| POST / PUT | `/api/admin/auto[/{id}]` | ADMIN | `titolo, marca, modello, anno, vin (facoltativo, univoco), descrizione, chilometraggio, carburante, condizione, prezzo, statoAnnuncio` |
| GET | `/api/admin/vin/{vin}` | ADMIN | decodifica VIN via Auto.dev → dati per precompilare il form |
| PATCH | `/api/admin/auto/{id}/prezzo` | ADMIN | `prezzo` |
| PATCH | `/api/admin/auto/{id}/stato` | ADMIN | `statoAnnuncio` |
| POST | `/api/admin/auto/{id}/immagini` | ADMIN | multipart, campo `files` (JPEG/PNG/WEBP, max 5 MB, max 10 per annuncio) |
| DELETE | `/api/admin/auto/{id}/immagini/{immagineId}` | ADMIN | |
| GET / POST | `/api/preferiti` | loggato | POST: `autoId` |
| DELETE | `/api/preferiti/{id}` | loggato | elimina anche l'eventuale avviso |
| GET / POST | `/api/avvisi` | loggato | POST: `autoId, soglia` (l'auto deve essere tra i preferiti) |
| GET / PUT / DELETE | `/api/avvisi/{id}` | loggato | PUT: `soglia, attivo`. Annuncio in bozza: GET e PUT → 404, DELETE consentito |
| POST | `/api/avvisi/disattiva` | pubblico | `token` (dal link nella mail) |
| GET | `/uploads/{file}` | pubblico | immagini |

Enum: `carburante` BENZINA, DIESEL, GPL, METANO, IBRIDA, ELETTRICA · `condizione` NUOVO, KM_0, USATO.

Errori: `{timestamp, status, messaggio, errori[]}`.

## Avvisi di prezzo

Quando l'admin abbassa il prezzo di un annuncio pubblicato, dopo il commit parte (in asincrono)
una mail per ogni avviso attivo la cui soglia è stata **attraversata**: prima prezzo ≥ soglia,
ora prezzo < soglia. Ulteriori ribassi sotto soglia non generano altre mail; l'avviso resta
attivo finché l'utente non lo disattiva.

Il confronto è sempre con l'ultimo prezzo visto dal pubblico: se l'annuncio viene messo in bozza,
ribassato e poi ripubblicato, alla ripubblicazione si confronta il nuovo prezzo con quello che aveva
quando è stato ritirato (un solo confronto, anche se stato e prezzo cambiano nello stesso PUT).

Il link nella mail punta al frontend (`FRONTEND_URL/avvisi/disattiva?token=…`), che poi chiama
`POST /api/avvisi/disattiva`: così i client di posta che pre-caricano i link non consumano il token.
Stesso schema per il reset password (`FRONTEND_URL/reset-password?token=…`).

## Decodifica VIN (Auto.dev)

Nel form dell'annuncio l'admin inserisce il VIN e il FE chiama `GET /api/admin/vin/{vin}`: il backend
interroga Auto.dev e restituisce `marca, modello, anno, allestimento, motore, carrozzeria, trazione,
cambio, carburanteSuggerito, titoloSuggerito, ambiguo`. Sono suggerimenti: l'admin li rivede e salva
con il normale POST/PUT. `carburanteSuggerito` è valorizzato solo se deducibile con certezza dal motore.

- La chiave (`AUTODEV_API_KEY`) sta solo nel `.env` e viaggia nell'header `Authorization`: il FE non la vede.
- Il VIN è validato (17 caratteri, senza I/O/Q) prima di chiamare Auto.dev.
- Risultati in cache in memoria (il piano free ha 1.000 chiamate/mese), timeout 3s/5s.
- Errori: VIN non trovato → 404; chiave errata, quota esaurita, Auto.dev giù o chiave mancante → 502.

## Sicurezza — cosa è garantito e dove

- **Solo DTO in ingresso** (`payloads/`): campi come `ruolo`, `utenteId`, `inviato` nel body
  vengono ignorati. Il proprietario è sempre l'utente del JWT.
- **Ricerca**: Criteria API con parametri legati (`AutoSpecifications`), `%` e `_` escapati.
  **Ordinamento**: elenco chiuso (`CampoOrdinamento`), qualsiasi altro valore → 400.
- **Testo utente**: la descrizione è solo testo (il FE non deve usare `dangerouslySetInnerHTML`);
  le mail sono template Thymeleaf (`src/main/resources/templates/mail/`) che usano solo `th:text`
  e `th:href`, con escape automatico di ogni valore. Mai `th:utext`.
- **Ruoli**: `/api/admin/**` solo ADMIN (403 per un USER). Il JWT contiene solo `sub`, `ver`, `iat`, `exp`;
  il ruolo viene riletto dal DB a ogni richiesta.
- **Reset password**: incrementa la versione dei token dell'utente (`ver`), quindi tutti i JWT emessi
  prima del reset smettono di valere subito (401), anche se non ancora scaduti.
- **Limite di tentativi** (`LimitatoreTentativi`, in memoria, finestra scorrevole) → 429:
  - login: 5 tentativi **falliti** in 15 minuti per IP + email; un login riuscito azzera il conteggio;
  - registrazione: 10 richieste all'ora per IP;
  - password dimenticata: 3 richieste all'ora per email, contate anche se l'email non esiste.

  Si azzera al riavvio e non è condiviso tra più istanze. L'IP è quello della connessione
  (`X-Forwarded-For` non è letto): dietro un proxy andrebbe configurato
  `server.forward-headers-strategy`. I limiti si cambiano con `app.limiti.login-falliti`,
  `app.limiti.registrazioni-per-ora`, `app.limiti.password-dimenticata-per-ora`.
- **Email già registrata → 409 (scelta voluta)**: la registrazione dice se l'email esiste, per
  un messaggio chiaro all'utente. Il limite sulle registrazioni per IP impedisce di verificare
  molte email in poco tempo. Login e password dimenticata invece non rivelano niente.
- **Proprietà**: preferiti e avvisi si cercano per id **e** proprietario → 404 identico a "non esiste".
- **Token nei link**: 32 byte casuali, nel DB solo l'hash SHA-256, monouso.
- **Log**: solo id, mai email, password o body. Segreti solo in `.env`.
