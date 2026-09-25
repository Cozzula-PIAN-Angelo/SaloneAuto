package it.epicode.saloneauto.controllers;

import it.epicode.saloneauto.payloads.AutoResponse;
import it.epicode.saloneauto.payloads.FiltriRicerca;
import it.epicode.saloneauto.payloads.PaginaResponse;
import it.epicode.saloneauto.services.AutoService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/** Catalogo pubblico: accessibile anche senza login, mostra solo annunci pubblicati. */
@RestController
@RequestMapping("/api/auto")
@RequiredArgsConstructor
public class AutoController {

    private final AutoService autoService;

    @GetMapping
    public PaginaResponse<AutoResponse> cerca(
            @ModelAttribute FiltriRicerca filtri,
            @RequestParam(defaultValue = "data") String ordinaPer,
            @RequestParam(defaultValue = "desc") String direzione,
            @RequestParam(defaultValue = "0") int pagina,
            @RequestParam(defaultValue = "12") int dimensione) {
        return autoService.cercaPubblicate(filtri, ordinaPer, direzione, pagina, dimensione);
    }

    @GetMapping("/{id}")
    public AutoResponse dettaglio(@PathVariable Long id) {
        return autoService.dettaglioPubblicata(id);
    }
}
