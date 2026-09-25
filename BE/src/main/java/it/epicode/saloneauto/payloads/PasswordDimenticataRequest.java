package it.epicode.saloneauto.payloads;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record PasswordDimenticataRequest(@NotBlank @Email @Size(max = 255) String email) {

    @Override
    public String toString() {
        return "PasswordDimenticataRequest[***]";
    }
}
