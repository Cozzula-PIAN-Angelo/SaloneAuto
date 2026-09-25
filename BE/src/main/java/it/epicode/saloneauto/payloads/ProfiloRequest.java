package it.epicode.saloneauto.payloads;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

// Il profilo modifica solo nome e cognome: ruolo, email e id non sono nel DTO
public record ProfiloRequest(
        @NotBlank @Size(max = 50) String nome,
        @NotBlank @Size(max = 50) String cognome
) {
}
