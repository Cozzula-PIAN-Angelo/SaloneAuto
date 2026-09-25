package it.epicode.saloneauto.services;

import it.epicode.saloneauto.exceptions.BadRequestException;
import org.springframework.data.domain.Sort;

/**
 * Elenco chiuso dei campi di ordinamento del catalogo. Il nome del campo non si può
 * legare come parametro SQL, quindi il valore del client viene solo confrontato con
 * questo elenco e mappato su una proprietà fissa: non arriva mai nella query.
 */
public enum CampoOrdinamento {
    PREZZO("prezzo", "prezzo"),
    KM("km", "chilometraggio"),
    DATA("data", "dataPubblicazione"),
    TITOLO("titolo", "titolo"),
    ANNO("anno", "anno");

    private final String parametro;
    private final String proprieta;

    CampoOrdinamento(String parametro, String proprieta) {
        this.parametro = parametro;
        this.proprieta = proprieta;
    }

    public static Sort daParametri(String campo, String direzione) {
        CampoOrdinamento scelto = null;
        for (CampoOrdinamento c : values()) {
            if (c.parametro.equals(campo)) {
                scelto = c;
            }
        }
        if (scelto == null) {
            throw new BadRequestException("Ordinamento non ammesso. Valori validi: prezzo, km, data, titolo, anno");
        }
        Sort.Direction dir = switch (direzione) {
            case "asc" -> Sort.Direction.ASC;
            case "desc" -> Sort.Direction.DESC;
            default -> throw new BadRequestException("Direzione non ammessa. Valori validi: asc, desc");
        };
        // id come secondo criterio: paginazione stabile anche a parità di valore
        return Sort.by(dir, scelto.proprieta).and(Sort.by(Sort.Direction.ASC, "id"));
    }
}
