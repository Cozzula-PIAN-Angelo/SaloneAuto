package it.epicode.saloneauto.payloads;

import it.epicode.saloneauto.entities.Ruolo;
import it.epicode.saloneauto.entities.Utente;

// Mai la password, nemmeno come hash
public record UtenteResponse(Long id, String nome, String cognome, String email, Ruolo ruolo) {

    public static UtenteResponse da(Utente u) {
        return new UtenteResponse(u.getId(), u.getNome(), u.getCognome(), u.getEmail(), u.getRuolo());
    }
}
