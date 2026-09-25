package it.epicode.saloneauto.controllers;

import it.epicode.saloneauto.entities.StatoAnnuncio;
import it.epicode.saloneauto.payloads.*;
import it.epicode.saloneauto.services.AutoService;
import it.epicode.saloneauto.services.ImmagineService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/** Gestione annunci: solo ADMIN (regola anche in SecurityConfig su /api/admin/**). */
@RestController
@RequestMapping("/api/admin/auto")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminAutoController {

    private final AutoService autoService;
    private final ImmagineService immagineService;

    @GetMapping
    public PaginaResponse<AutoResponse> elenco(
            @RequestParam(required = false) StatoAnnuncio stato,
            @ModelAttribute FiltriRicerca filtri,
            @RequestParam(defaultValue = "data") String ordinaPer,
            @RequestParam(defaultValue = "desc") String direzione,
            @RequestParam(defaultValue = "0") int pagina,
            @RequestParam(defaultValue = "12") int dimensione) {
        return autoService.cercaTutte(stato, filtri, ordinaPer, direzione, pagina, dimensione);
    }

    @GetMapping("/{id}")
    public AutoResponse dettaglio(@PathVariable Long id) {
        return autoService.dettaglio(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AutoResponse crea(@RequestBody @Valid AutoRequest body) {
        return autoService.crea(body);
    }

    @PutMapping("/{id}")
    public AutoResponse aggiorna(@PathVariable Long id, @RequestBody @Valid AutoRequest body) {
        return autoService.aggiorna(id, body);
    }

    @PatchMapping("/{id}/prezzo")
    public AutoResponse aggiornaPrezzo(@PathVariable Long id, @RequestBody @Valid PrezzoRequest body) {
        return autoService.aggiornaPrezzo(id, body.prezzo());
    }

    @PatchMapping("/{id}/stato")
    public AutoResponse aggiornaStato(@PathVariable Long id, @RequestBody @Valid StatoAnnuncioRequest body) {
        return autoService.aggiornaStato(id, body.statoAnnuncio());
    }

    @PostMapping(value = "/{id}/immagini", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public AutoResponse caricaImmagini(@PathVariable Long id, @RequestParam("files") List<MultipartFile> files) {
        return immagineService.carica(id, files);
    }

    @DeleteMapping("/{id}/immagini/{immagineId}")
    public AutoResponse eliminaImmagine(@PathVariable Long id, @PathVariable Long immagineId) {
        return immagineService.elimina(id, immagineId);
    }
}
