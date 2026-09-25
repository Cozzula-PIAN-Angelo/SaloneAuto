package it.epicode.saloneauto.payloads;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record DisattivaAvvisoRequest(@NotBlank @Size(max = 100) String token) {

    @Override
    public String toString() {
        return "DisattivaAvvisoRequest[***]";
    }
}
