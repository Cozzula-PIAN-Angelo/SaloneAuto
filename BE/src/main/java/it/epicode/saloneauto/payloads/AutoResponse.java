package it.epicode.saloneauto.payloads;

import it.epicode.saloneauto.entities.Auto;
import it.epicode.saloneauto.entities.Carburante;
import it.epicode.saloneauto.entities.Condizione;
import it.epicode.saloneauto.entities.StatoAnnuncio;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record AutoResponse(
        Long id,
        String titolo,
        String marca,
        String modello,
        Integer anno,
        String vin,
        String descrizione,
        Integer chilometraggio,
        Carburante carburante,
        Condizione condizione,
        BigDecimal prezzo,
        StatoAnnuncio statoAnnuncio,
        LocalDateTime dataCreazione,
        LocalDateTime dataPubblicazione,
        List<ImmagineResponse> immagini
) {
    public static AutoResponse da(Auto a) {
        return new AutoResponse(a.getId(), a.getTitolo(), a.getMarca(), a.getModello(), a.getAnno(), a.getVin(),
                a.getDescrizione(), a.getChilometraggio(), a.getCarburante(), a.getCondizione(), a.getPrezzo(),
                a.getStatoAnnuncio(), a.getDataCreazione(), a.getDataPubblicazione(),
                a.getImmagini().stream().map(ImmagineResponse::da).toList());
    }
}
