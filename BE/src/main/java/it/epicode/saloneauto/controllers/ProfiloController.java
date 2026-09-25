package it.epicode.saloneauto.controllers;

import it.epicode.saloneauto.entities.Utente;
import it.epicode.saloneauto.payloads.ProfiloRequest;
import it.epicode.saloneauto.payloads.UtenteResponse;
import it.epicode.saloneauto.services.UtenteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/me")
@RequiredArgsConstructor
public class ProfiloController {

    private final UtenteService utenteService;

    @GetMapping
    public UtenteResponse profilo(@AuthenticationPrincipal Utente utente) {
        return utenteService.profilo(utente.getId());
    }

    @PutMapping
    public UtenteResponse aggiorna(@AuthenticationPrincipal Utente utente, @RequestBody @Valid ProfiloRequest body) {
        return utenteService.aggiornaProfilo(utente.getId(), body);
    }
}
