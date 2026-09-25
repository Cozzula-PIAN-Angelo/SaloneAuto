package it.epicode.saloneauto.payloads;

import it.epicode.saloneauto.entities.ImmagineAuto;

// url relativo al backend, es. /uploads/3f2a....jpg
public record ImmagineResponse(Long id, String url, Integer ordine) {

    public static ImmagineResponse da(ImmagineAuto i) {
        return new ImmagineResponse(i.getId(), "/uploads/" + i.getNomeFile(), i.getOrdine());
    }
}
