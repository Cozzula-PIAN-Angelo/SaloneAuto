package it.epicode.saloneauto.services;

import it.epicode.saloneauto.entities.Auto;
import it.epicode.saloneauto.entities.Preferito;
import it.epicode.saloneauto.entities.StatoAnnuncio;
import it.epicode.saloneauto.exceptions.ConflictException;
import it.epicode.saloneauto.exceptions.NotFoundException;
import it.epicode.saloneauto.payloads.PreferitoResponse;
import it.epicode.saloneauto.repositories.AutoRepository;
import it.epicode.saloneauto.repositories.AvvisoRepository;
import it.epicode.saloneauto.repositories.PreferitoRepository;
import it.epicode.saloneauto.repositories.UtenteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PreferitoService {

    private final PreferitoRepository preferitoRepository;
    private final AvvisoRepository avvisoRepository;
    private final AutoRepository autoRepository;
    private final UtenteRepository utenteRepository;

    @Transactional(readOnly = true)
    public List<PreferitoResponse> elenco(Long utenteId) {
        return preferitoRepository
                .findByUtenteIdAndAutoStatoAnnuncioOrderByDataAggiuntaDesc(utenteId, StatoAnnuncio.PUBBLICATO)
                .stream().map(PreferitoResponse::da).toList();
    }

    @Transactional
    public PreferitoResponse aggiungi(Long utenteId, Long autoId) {
        Auto auto = autoRepository.findByIdAndStatoAnnuncio(autoId, StatoAnnuncio.PUBBLICATO)
                .orElseThrow(() -> new NotFoundException("Annuncio non trovato"));
        if (preferitoRepository.existsByUtenteIdAndAutoId(utenteId, autoId)) {
            throw new ConflictException("Auto già tra i preferiti");
        }
        Preferito preferito = new Preferito(utenteRepository.getReferenceById(utenteId), auto);
        return PreferitoResponse.da(preferitoRepository.save(preferito));
    }

    @Transactional
    public void rimuovi(Long utenteId, Long preferitoId) {
        Preferito preferito = preferitoRepository.findByIdAndUtenteId(preferitoId, utenteId)
                .orElseThrow(() -> new NotFoundException("Preferito non trovato"));
        // Senza il preferito l'avviso sul prezzo non ha più senso
        avvisoRepository.deleteByUtenteIdAndAutoId(utenteId, preferito.getAuto().getId());
        preferitoRepository.delete(preferito);
    }
}
