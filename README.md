# Salone Auto

Concessionaria di auto di lusso: catalogo con filtri, preferiti, avvisi di calo prezzo via email
e pannello di amministrazione degli annunci.

| Cartella | Contenuto |
|---|---|
| [`BE/`](BE/README.md) | API REST — Java 21, Spring Boot, Spring Security + JWT, PostgreSQL |
| [`FE/`](FE/README.md) | Frontend — React, Vite, TypeScript, Tailwind (design realizzato con Google Stitch) |

## Demo online

**https://salone-auto-fe.onrender.com** — si accede con l'account admin qui sotto, oppure
registrandosi come utente normale.

Pubblicata sul piano gratuito di Render (configurazione in [`render.yaml`](render.yaml)), che ha
alcuni limiti:

- **Prima apertura lenta**: dopo 15 minuti di inattività il backend si spegne e la prima richiesta
  può richiedere circa un minuto. Poi risponde normalmente.
- **Mail**: partono tramite Brevo (SMTP), perché il piano gratuito blocca le porte SMTP standard.
  Possono finire nello **spam**.
- **Immagini**: sono salvate sul disco del server, che si azzera a ogni riavvio. Alcuni annunci
  potrebbero quindi comparire senza foto.

Per provare l'avviso di prezzo: registrati con la tua email, aggiungi un'auto ai preferiti e crea
un avviso con una soglia sotto il prezzo attuale. Poi accedi come admin e, dal pannello annunci,
abbassa il prezzo di quell'auto sotto la soglia: arriva la mail, con il link per disattivare l'avviso.

## Account admin di prova

| Email | Password |
|---|---|
| `admin.test@salone.local` | `Salone-b6JA5qKo` |

Vale sia per la demo online sia in locale, dove viene creato automaticamente al primo avvio del
backend perché le credenziali sono già in `BE/.env.example`. Dopo l'accesso su `/accedi` si apre
il pannello `/admin`.
Per provare come utente normale basta registrarsi da `/registrati`.

## Avvio rapido

1. **Database**: crea il database `salone_auto` su PostgreSQL.
2. **Backend**:
   ```bash
   cd BE
   cp .env.example .env   # compila almeno DB_PASSWORD e JWT_SECRET (min. 32 caratteri)
   mvn spring-boot:run    # http://localhost:8080
   ```
3. **Frontend**:
   ```bash
   cd FE
   npm install
   npm run dev            # http://localhost:5173
   ```

Il catalogo parte vuoto: gli annunci si creano dal pannello admin (anche con la decodifica VIN,
se `AUTODEV_API_KEY` è impostata). Dettagli su endpoint, ruoli e sicurezza nel
[README del backend](BE/README.md).
