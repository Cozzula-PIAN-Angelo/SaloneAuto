package it.epicode.saloneauto.payloads;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

// Niente campo ruolo: lo decide il server. Campi extra nel JSON vengono ignorati.
public record RegistrazioneRequest(
        @NotBlank @Size(max = 50) String nome,
        @NotBlank @Size(max = 50) String cognome,
        @NotBlank @Email @Size(max = 255) String email,
        // 72 byte è il limite di BCrypt
        @NotBlank @Size(min = 8) @MassimoByte(72) String password
) {
    @Override
    public String toString() {
        return "RegistrazioneRequest[***]";
    }
}
