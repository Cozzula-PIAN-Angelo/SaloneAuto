package it.epicode.saloneauto.payloads;

import it.epicode.saloneauto.entities.Avviso;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record AvvisoResponse(
        Long id,
        Long autoId,
        String titoloAuto,
        BigDecimal prezzoAttuale,
        BigDecimal soglia,
        boolean attivo,
        LocalDateTime dataCreazione,
        LocalDateTime ultimaNotifica
) {
    public static AvvisoResponse da(Avviso a) {
        return new AvvisoResponse(a.getId(), a.getAuto().getId(), a.getAuto().getTitolo(), a.getAuto().getPrezzo(),
                a.getSoglia(), a.isAttivo(), a.getDataCreazione(), a.getUltimaNotifica());
    }
}
