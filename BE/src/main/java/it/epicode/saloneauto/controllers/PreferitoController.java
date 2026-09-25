package it.epicode.saloneauto.controllers;

import it.epicode.saloneauto.entities.Utente;
import it.epicode.saloneauto.payloads.PreferitoRequest;
import it.epicode.saloneauto.payloads.PreferitoResponse;
import it.epicode.saloneauto.services.PreferitoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/preferiti")
@RequiredArgsConstructor
public class PreferitoController {

    private final PreferitoService preferitoService;

    @GetMapping
    public List<PreferitoResponse> elenco(@AuthenticationPrincipal Utente utente) {
        return preferitoService.elenco(utente.getId());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PreferitoResponse aggiungi(@AuthenticationPrincipal Utente utente, @RequestBody @Valid PreferitoRequest body) {
        return preferitoService.aggiungi(utente.getId(), body.autoId());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void rimuovi(@AuthenticationPrincipal Utente utente, @PathVariable Long id) {
        preferitoService.rimuovi(utente.getId(), id);
    }
}
