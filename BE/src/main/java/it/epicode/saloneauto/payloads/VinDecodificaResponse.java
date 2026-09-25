package it.epicode.saloneauto.payloads;

import it.epicode.saloneauto.entities.Carburante;

/**
 * Dati per precompilare il form dell'annuncio. Sono suggerimenti: l'admin li rivede
 * e li invia con il normale POST/PUT, che li valida come qualsiasi altro input.
 * carburanteSuggerito è null se non deducibile con certezza; ambiguo = true se Auto.dev
 * non ha potuto identificare un solo allestimento.
 */
public record VinDecodificaResponse(
        String vin,
        String marca,
        String modello,
        Integer anno,
        String allestimento,
        String motore,
        String carrozzeria,
        String trazione,
        String cambio,
        Carburante carburanteSuggerito,
        String titoloSuggerito,
        boolean ambiguo
) {
}
