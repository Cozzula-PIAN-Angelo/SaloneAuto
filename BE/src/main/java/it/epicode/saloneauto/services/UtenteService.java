package it.epicode.saloneauto.services;

import it.epicode.saloneauto.entities.Utente;
import it.epicode.saloneauto.exceptions.NotFoundException;
import it.epicode.saloneauto.payloads.ProfiloRequest;
import it.epicode.saloneauto.payloads.UtenteResponse;
import it.epicode.saloneauto.repositories.UtenteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UtenteService {

    private final UtenteRepository utenteRepository;

    @Transactional(readOnly = true)
    public UtenteResponse profilo(Long utenteId) {
        return UtenteResponse.da(trova(utenteId));
    }

    @Transactional
    public UtenteResponse aggiornaProfilo(Long utenteId, ProfiloRequest body) {
        Utente utente = trova(utenteId);
        utente.setNome(body.nome().trim());
        utente.setCognome(body.cognome().trim());
        return UtenteResponse.da(utente);
    }

    Utente trova(Long utenteId) {
        return utenteRepository.findById(utenteId)
                .orElseThrow(() -> new NotFoundException("Utente non trovato"));
    }
}
