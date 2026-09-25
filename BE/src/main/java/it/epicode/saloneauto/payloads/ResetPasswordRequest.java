package it.epicode.saloneauto.payloads;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ResetPasswordRequest(
        @NotBlank @Size(max = 100) String token,
        @NotBlank @Size(min = 8) @MassimoByte(72) String nuovaPassword
) {
    @Override
    public String toString() {
        return "ResetPasswordRequest[***]";
    }
}
