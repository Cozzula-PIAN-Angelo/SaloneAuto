package it.epicode.saloneauto.controllers;

import it.epicode.saloneauto.entities.Utente;
import it.epicode.saloneauto.payloads.*;
import it.epicode.saloneauto.services.AvvisoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/avvisi")
@RequiredArgsConstructor
public class AvvisoController {

    private final AvvisoService avvisoService;

    @GetMapping
    public List<AvvisoResponse> elenco(@AuthenticationPrincipal Utente utente) {
        return avvisoService.elenco(utente.getId());
    }

    @GetMapping("/{id}")
    public AvvisoResponse dettaglio(@AuthenticationPrincipal Utente utente, @PathVariable Long id) {
        return avvisoService.dettaglio(utente.getId(), id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AvvisoResponse crea(@AuthenticationPrincipal Utente utente, @RequestBody @Valid AvvisoCreateRequest body) {
        return avvisoService.crea(utente.getId(), body);
    }

    @PutMapping("/{id}")
    public AvvisoResponse aggiorna(@AuthenticationPrincipal Utente utente, @PathVariable Long id,
                                   @RequestBody @Valid AvvisoUpdateRequest body) {
        return avvisoService.aggiorna(utente.getId(), id, body);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void elimina(@AuthenticationPrincipal Utente utente, @PathVariable Long id) {
        avvisoService.elimina(utente.getId(), id);
    }

    /** Pubblico: chiamato dalla pagina del FE aperta dal link nella mail. */
    @PostMapping("/disattiva")
    public MessaggioResponse disattiva(@RequestBody @Valid DisattivaAvvisoRequest body) {
        avvisoService.disattivaConToken(body.token());
        return new MessaggioResponse("Avviso disattivato");
    }
}
