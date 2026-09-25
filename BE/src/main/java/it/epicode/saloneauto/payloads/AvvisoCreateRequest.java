package it.epicode.saloneauto.payloads;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

// Niente utenteId, attivo o ultimaNotifica: li gestisce il server
public record AvvisoCreateRequest(
        @NotNull @Positive Long autoId,
        @NotNull @DecimalMin("0.01") @Digits(integer = 10, fraction = 2) BigDecimal soglia
) {
}
