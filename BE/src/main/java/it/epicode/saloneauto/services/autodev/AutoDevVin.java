package it.epicode.saloneauto.services.autodev;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * Risposta di GET https://api.auto.dev/vin/{vin} (solo i campi che usiamo).
 * Sono dati esterni: vanno trattati come testo non fidato, al pari dell'input utente.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record AutoDevVin(
        String vin,
        Boolean vinValid,
        String make,
        String model,
        String trim,
        String style,
        String body,
        String engine,
        String drive,
        String transmission,
        Veicolo vehicle,
        Boolean ambiguous
) {
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Veicolo(Integer year, String make, String model, String manufacturer) {
    }
}
