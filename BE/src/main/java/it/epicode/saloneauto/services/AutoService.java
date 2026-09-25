package it.epicode.saloneauto.services;

import it.epicode.saloneauto.entities.Auto;
import it.epicode.saloneauto.entities.StatoAnnuncio;
import it.epicode.saloneauto.events.PrezzoScesoEvent;
import it.epicode.saloneauto.exceptions.BadRequestException;
import it.epicode.saloneauto.exceptions.ConflictException;
import it.epicode.saloneauto.exceptions.NotFoundException;
import it.epicode.saloneauto.payloads.AutoRequest;
import it.epicode.saloneauto.payloads.AutoResponse;
import it.epicode.saloneauto.payloads.FiltriRicerca;
import it.epicode.saloneauto.payloads.PaginaResponse;
import it.epicode.saloneauto.payloads.VinFormato;
import it.epicode.saloneauto.repositories.AutoRepository;
import it.epicode.saloneauto.repositories.AutoSpecifications;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.Year;

@Service
@RequiredArgsConstructor
public class AutoService {

    public static final int DIMENSIONE_MASSIMA_PAGINA = 50;

    private final AutoRepository autoRepository;
    private final ApplicationEventPublisher eventPublisher;

    // ===== Catalogo pubblico =====

    @Transactional(readOnly = true)
    public PaginaResponse<AutoResponse> cercaPubblicate(FiltriRicerca filtri, String ordinaPer, String direzione,
                                                        int pagina, int dimensione) {
        return cerca(StatoAnnuncio.PUBBLICATO, filtri, ordinaPer, direzione, pagina, dimensione);
    }

    @Transactional(readOnly = true)
    public AutoResponse dettaglioPubblicata(Long id) {
        // Una bozza è indistinguibile da un annuncio inesistente
        return autoRepository.findByIdAndStatoAnnuncio(id, StatoAnnuncio.PUBBLICATO)
                .map(AutoResponse::da)
                .orElseThrow(() -> new NotFoundException("Annuncio non trovato"));
    }

    // ===== Amministrazione =====

    @Transactional(readOnly = true)
    public PaginaResponse<AutoResponse> cercaTutte(StatoAnnuncio stato, FiltriRicerca filtri, String ordinaPer,
                                                   String direzione, int pagina, int dimensione) {
        return cerca(stato, filtri, ordinaPer, direzione, pagina, dimensione);
    }

    @Transactional(readOnly = true)
    public AutoResponse dettaglio(Long id) {
        return AutoResponse.da(trova(id));
    }

    @Transactional
    public AutoResponse crea(AutoRequest body) {
        Auto auto = new Auto();
        auto.setDataCreazione(LocalDateTime.now());
        copiaDati(auto, body);
        auto.setPrezzo(body.prezzo());
        applicaStato(auto, body.statoAnnuncio());
        return AutoResponse.da(autoRepository.save(auto));
    }

    @Transactional
    public AutoResponse aggiorna(Long id, AutoRequest body) {
        Auto auto = trova(id);
        copiaDati(auto, body);
        cambiaPrezzoEStato(auto, body.prezzo(), body.statoAnnuncio());
        return AutoResponse.da(auto);
    }

    @Transactional
    public AutoResponse aggiornaPrezzo(Long id, BigDecimal prezzo) {
        Auto auto = trova(id);
        cambiaPrezzoEStato(auto, prezzo, auto.getStatoAnnuncio());
        return AutoResponse.da(auto);
    }

    @Transactional
    public AutoResponse aggiornaStato(Long id, StatoAnnuncio stato) {
        Auto auto = trova(id);
        cambiaPrezzoEStato(auto, auto.getPrezzo(), stato);
        return AutoResponse.da(auto);
    }

    Auto trova(Long id) {
        return autoRepository.findById(id).orElseThrow(() -> new NotFoundException("Annuncio non trovato"));
    }

    // ===== Interni =====

    private PaginaResponse<AutoResponse> cerca(StatoAnnuncio stato, FiltriRicerca f, String ordinaPer,
                                               String direzione, int pagina, int dimensione) {
        if (pagina < 0 || dimensione < 1 || dimensione > DIMENSIONE_MASSIMA_PAGINA) {
            throw new BadRequestException("Paginazione non valida (dimensione massima " + DIMENSIONE_MASSIMA_PAGINA + ")");
        }
        Sort sort = CampoOrdinamento.daParametri(ordinaPer, direzione);
        return PaginaResponse.da(autoRepository.findAll(AutoSpecifications.conFiltri(stato, f),
                        PageRequest.of(pagina, dimensione, sort)),
                AutoResponse::da);
    }

    private void copiaDati(Auto auto, AutoRequest body) {
        if (body.anno() > Year.now().getValue() + 1) {
            throw new BadRequestException("Anno non valido");
        }
        String vin = VinFormato.normalizza(body.vin());
        if (vin != null && (auto.getId() == null ? autoRepository.existsByVin(vin)
                : autoRepository.existsByVinAndIdNot(vin, auto.getId()))) {
            throw new ConflictException("Esiste già un annuncio con questo VIN");
        }
        auto.setTitolo(body.titolo().trim());
        auto.setMarca(body.marca().trim());
        auto.setModello(body.modello().trim());
        auto.setAnno(body.anno());
        auto.setVin(vin);
        auto.setDescrizione(body.descrizione());
        auto.setChilometraggio(body.chilometraggio());
        auto.setCarburante(body.carburante());
        auto.setCondizione(body.condizione());
    }

    private void applicaStato(Auto auto, StatoAnnuncio nuovo) {
        if (nuovo == StatoAnnuncio.PUBBLICATO && auto.getStatoAnnuncio() != StatoAnnuncio.PUBBLICATO) {
            auto.setDataPubblicazione(LocalDateTime.now());
        }
        auto.setStatoAnnuncio(nuovo);
    }

    /**
     * Unico punto in cui cambiano prezzo e stato di un annuncio esistente. Il nuovo prezzo si
     * confronta con l'ultimo prezzo visto dal pubblico: quello attuale se l'annuncio era già
     * pubblicato, quello al momento del ritiro in bozza se viene ripubblicato. Se è sceso su un
     * annuncio pubblicato parte un solo evento, che (dopo il commit) notifica gli avvisi interessati.
     */
    private void cambiaPrezzoEStato(Auto auto, BigDecimal nuovoPrezzo, StatoAnnuncio nuovoStato) {
        boolean eraPubblicato = auto.getStatoAnnuncio() == StatoAnnuncio.PUBBLICATO;
        BigDecimal ultimoPrezzoPubblico = eraPubblicato ? auto.getPrezzo() : auto.getPrezzoAlRitiro();
        applicaStato(auto, nuovoStato);
        auto.setPrezzo(nuovoPrezzo);
        if (nuovoStato == StatoAnnuncio.PUBBLICATO) {
            auto.setPrezzoAlRitiro(null);
            if (ultimoPrezzoPubblico != null && nuovoPrezzo.compareTo(ultimoPrezzoPubblico) < 0) {
                eventPublisher.publishEvent(new PrezzoScesoEvent(auto.getId(), ultimoPrezzoPubblico, nuovoPrezzo));
            }
        } else if (eraPubblicato) {
            auto.setPrezzoAlRitiro(ultimoPrezzoPubblico);
        }
    }
}
