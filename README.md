# Salone Auto

Concessionaria di auto di lusso: catalogo con filtri, preferiti, avvisi di calo prezzo via email
e pannello di amministrazione degli annunci.

| Cartella | Contenuto |
|---|---|
| [`BE/`](BE/README.md) | API REST — Java 21, Spring Boot, Spring Security + JWT, PostgreSQL |
| [`FE/`](FE/README.md) | Frontend — React, Vite, TypeScript, Tailwind (design realizzato con Google Stitch) |

## Account admin di prova

| Email | Password |
|---|---|
| `admin.test@salone.local` | `Salone-b6JA5qKo` |

Viene creato automaticamente al primo avvio del backend, perché le credenziali sono già in
`BE/.env.example`. Dopo l'accesso su `/accedi` si apre il pannello `/admin`.
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
