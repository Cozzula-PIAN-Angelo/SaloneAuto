package it.epicode.saloneauto.payloads;

import it.epicode.saloneauto.entities.Preferito;

import java.time.LocalDateTime;

public record PreferitoResponse(Long id, AutoResponse auto, LocalDateTime dataAggiunta) {

    public static PreferitoResponse da(Preferito p) {
        return new PreferitoResponse(p.getId(), AutoResponse.da(p.getAuto()), p.getDataAggiunta());
    }
}
