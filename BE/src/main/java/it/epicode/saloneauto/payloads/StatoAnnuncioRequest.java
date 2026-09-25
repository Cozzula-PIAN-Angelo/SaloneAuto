package it.epicode.saloneauto.payloads;

import it.epicode.saloneauto.entities.StatoAnnuncio;
import jakarta.validation.constraints.NotNull;

public record StatoAnnuncioRequest(@NotNull StatoAnnuncio statoAnnuncio) {
}
