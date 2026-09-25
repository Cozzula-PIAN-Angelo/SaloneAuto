package it.epicode.saloneauto.controllers;

import it.epicode.saloneauto.payloads.VinDecodificaResponse;
import it.epicode.saloneauto.services.VinService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Decodifica VIN via Auto.dev, per precompilare il form dell'annuncio. Solo ADMIN. */
@RestController
@RequestMapping("/api/admin/vin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminVinController {

    private final VinService vinService;

    @GetMapping("/{vin}")
    public VinDecodificaResponse decodifica(@PathVariable String vin) {
        return vinService.decodifica(vin);
    }
}
