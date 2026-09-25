package it.epicode.saloneauto.payloads;

import it.epicode.saloneauto.entities.Carburante;
import it.epicode.saloneauto.entities.Condizione;
import it.epicode.saloneauto.entities.StatoAnnuncio;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;

public record AutoRequest(
        @NotBlank @Size(max = 150) String titolo,
        @NotBlank @Size(max = 50) String marca,
        @NotBlank @Size(max = 80) String modello,
        @NotNull @Min(1900) @Max(2100) Integer anno,
        // Facoltativo. 17 caratteri, senza I, O e Q (non ammesse nei VIN)
        @Pattern(regexp = VinFormato.REGEX, message = "VIN non valido") String vin,
        @NotBlank @Size(max = 5000) String descrizione,
        @NotNull @PositiveOrZero @Max(5_000_000) Integer chilometraggio,
        @NotNull Carburante carburante,
        @NotNull Condizione condizione,
        @NotNull @DecimalMin("0.01") @Digits(integer = 10, fraction = 2) BigDecimal prezzo,
        @NotNull StatoAnnuncio statoAnnuncio
) {
    public AutoRequest {
        // Un form con il campo VIN lasciato vuoto manda "": vale come "non indicato"
        if (vin != null && vin.isBlank()) {
            vin = null;
        }
    }
}
