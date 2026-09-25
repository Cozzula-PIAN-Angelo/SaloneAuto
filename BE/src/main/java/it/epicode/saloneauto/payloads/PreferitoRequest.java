package it.epicode.saloneauto.payloads;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

// Solo l'auto: il proprietario è sempre l'utente autenticato
public record PreferitoRequest(@NotNull @Positive Long autoId) {
}
