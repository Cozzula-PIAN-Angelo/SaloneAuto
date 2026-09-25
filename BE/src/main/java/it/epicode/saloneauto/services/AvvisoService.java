package it.epicode.saloneauto.services;

import it.epicode.saloneauto.entities.Auto;
import it.epicode.saloneauto.entities.Avviso;
import it.epicode.saloneauto.entities.StatoAnnuncio;
import it.epicode.saloneauto.exceptions.BadRequestException;
import it.epicode.saloneauto.exceptions.ConflictException;
import it.epicode.saloneauto.exceptions.NotFoundException;
import it.epicode.saloneauto.payloads.AvvisoCreateRequest;
import it.epicode.saloneauto.payloads.AvvisoResponse;
import it.epicode.saloneauto.payloads.AvvisoUpdateRequest;
import it.epicode.saloneauto.repositories.AutoRepository;
import it.epicode.saloneauto.repositories.AvvisoRepository;
import it.epicode.saloneauto.repositories.PreferitoRepository;
import it.epicode.saloneauto.repositories.UtenteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AvvisoService {

    private final AvvisoRepository avvisoRepository;
    private final PreferitoRepository preferitoRepository;
    private final AutoRepository autoRepository;
    private final UtenteRepository utenteRepository;
    private final TokenService tokenService;

    /** Dati già estratti dalle entity, pronti per la mail (che parte fuori transazione). */
    public record NotificaAvviso(Long avvisoId, Long autoId, String nome, String email, String titoloAuto,
                                 BigDecimal prezzo, BigDecimal soglia, String tokenDisattivazione) {
        @Override
        public String toString() {
            return "NotificaAvviso[avvisoId=" + avvisoId + "]";
        }
    }

    @Transactional(readOnly = true)
    public List<AvvisoResponse> elenco(Long utenteId) {
        return avvisoRepository
                .findByUtenteIdAndAutoStatoAnnuncioOrderByDataCreazioneDesc(utenteId, StatoAnnuncio.PUBBLICATO)
                .stream().map(AvvisoResponse::da).toList();
    }

    @Transactional(readOnly = true)
    public AvvisoResponse dettaglio(Long utenteId, Long avvisoId) {
        return AvvisoResponse.da(trovaVisibile(utenteId, avvisoId));
    }

    @Transactional
    public AvvisoResponse crea(Long utenteId, AvvisoCreateRequest body) {
        Auto auto = autoRepository.findByIdAndStatoAnnuncio(body.autoId(), StatoAnnuncio.PUBBLICATO)
                .orElseThrow(() -> new NotFoundException("Annuncio non trovato"));
        if (!preferitoRepository.existsByUtenteIdAndAutoId(utenteId, auto.getId())) {
            throw new BadRequestException("Aggiungi prima l'auto ai preferiti");
        }
        if (avvisoRepository.existsByUtenteIdAndAutoId(utenteId, auto.getId())) {
            throw new ConflictException("Esiste già un avviso per quest'auto");
        }
        verificaSoglia(body.soglia(), auto);
        Avviso avviso = new Avviso(utenteRepository.getReferenceById(utenteId), auto, body.soglia());
        return AvvisoResponse.da(avvisoRepository.save(avviso));
    }

    @Transactional
    public AvvisoResponse aggiorna(Long utenteId, Long avvisoId, AvvisoUpdateRequest body) {
        Avviso avviso = trovaVisibile(utenteId, avvisoId);
        // Dopo una notifica il prezzo è già sotto soglia: si valida solo una soglia nuova
        if (body.soglia().compareTo(avviso.getSoglia()) != 0) {
            verificaSoglia(body.soglia(), avviso.getAuto());
        }
        avviso.setSoglia(body.soglia());
        avviso.setAttivo(body.attivo());
        return AvvisoResponse.da(avviso);
    }

    @Transactional
    public void elimina(Long utenteId, Long avvisoId) {
        avvisoRepository.delete(trovaDelProprietario(utenteId, avvisoId));
    }

    /** Link della mail: token casuale e monouso, mai l'id dell'avviso. */
    @Transactional
    public void disattivaConToken(String token) {
        Avviso avviso = avvisoRepository.findByTokenDisattivazioneHash(tokenService.hash(token))
                .orElseThrow(() -> new NotFoundException("Link non valido o già usato"));
        avviso.setAttivo(false);
        avviso.setTokenDisattivazioneHash(null);
    }

    /**
     * Per ogni avviso che ha appena visto il prezzo attraversare la soglia genera un nuovo token
     * di disattivazione (quello precedente smette di valere). Il commit avviene prima dell'invio
     * delle mail, così il link è già valido quando arriva.
     */
    @Transactional
    public List<NotificaAvviso> preparaNotifiche(Long autoId, BigDecimal prezzoVecchio, BigDecimal prezzoNuovo) {
        return avvisoRepository.findDaNotificare(autoId, prezzoVecchio, prezzoNuovo).stream()
                .map(avviso -> {
                    String token = tokenService.generaToken();
                    avviso.setTokenDisattivazioneHash(tokenService.hash(token));
                    avviso.setUltimaNotifica(LocalDateTime.now());
                    return new NotificaAvviso(avviso.getId(), autoId, avviso.getUtente().getNome(),
                            avviso.getUtente().getEmail(), avviso.getAuto().getTitolo(), prezzoNuovo,
                            avviso.getSoglia(), token);
                })
                .toList();
    }

    private Avviso trovaDelProprietario(Long utenteId, Long avvisoId) {
        // Stesso 404 sia se l'avviso non esiste sia se appartiene a un altro utente
        return avvisoRepository.findByIdAndUtenteId(avvisoId, utenteId)
                .orElseThrow(() -> new NotFoundException("Avviso non trovato"));
    }

    /**
     * Come trovaDelProprietario, ma l'annuncio deve essere pubblicato: una bozza è nascosta
     * anche qui (titolo e prezzo) come nell'elenco e nel catalogo. L'eliminazione resta possibile.
     */
    private Avviso trovaVisibile(Long utenteId, Long avvisoId) {
        return avvisoRepository.findByIdAndUtenteIdAndAutoStatoAnnuncio(avvisoId, utenteId, StatoAnnuncio.PUBBLICATO)
                .orElseThrow(() -> new NotFoundException("Avviso non trovato"));
    }

    private void verificaSoglia(BigDecimal soglia, Auto auto) {
        if (soglia.compareTo(auto.getPrezzo()) > 0) {
            throw new BadRequestException("La soglia deve essere minore o uguale al prezzo attuale");
        }
    }
}
