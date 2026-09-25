package it.epicode.saloneauto.payloads;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LoginRequest(
        @NotBlank @Size(max = 255) String email,
        @NotBlank @MassimoByte(72) String password
) {
    @Override
    public String toString() {
        return "LoginRequest[***]";
    }
}
