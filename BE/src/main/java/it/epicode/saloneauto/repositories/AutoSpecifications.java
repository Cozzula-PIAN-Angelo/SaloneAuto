package it.epicode.saloneauto.repositories;

import it.epicode.saloneauto.entities.Auto;
import it.epicode.saloneauto.entities.StatoAnnuncio;
import it.epicode.saloneauto.payloads.FiltriRicerca;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * Filtri del catalogo costruiti con la Criteria API: ogni valore arrivato dal client
 * diventa un parametro legato, niente viene concatenato nella query.
 */
public final class AutoSpecifications {

    private static final char ESCAPE = '\\';

    private AutoSpecifications() {
    }

    public static Specification<Auto> conFiltri(StatoAnnuncio stato, FiltriRicerca f) {
        return (root, query, cb) -> {
            List<Predicate> predicati = new ArrayList<>();
            if (stato != null) {
                predicati.add(cb.equal(root.get("statoAnnuncio"), stato));
            }
            if (pieno(f.q())) {
                String pattern = "%" + escapeLike(minuscolo(f.q())) + "%";
                predicati.add(cb.or(
                        cb.like(cb.lower(root.get("titolo")), pattern, ESCAPE),
                        cb.like(cb.lower(root.get("descrizione")), pattern, ESCAPE)));
            }
            // Marca e modello: uguaglianza senza distinzione maiuscole/minuscole
            if (pieno(f.marca())) {
                predicati.add(cb.equal(cb.lower(root.get("marca")), minuscolo(f.marca())));
            }
            if (pieno(f.modello())) {
                predicati.add(cb.equal(cb.lower(root.get("modello")), minuscolo(f.modello())));
            }
            if (f.carburante() != null) {
                predicati.add(cb.equal(root.get("carburante"), f.carburante()));
            }
            if (f.condizione() != null) {
                predicati.add(cb.equal(root.get("condizione"), f.condizione()));
            }
            if (f.prezzoMin() != null) {
                predicati.add(cb.greaterThanOrEqualTo(root.get("prezzo"), f.prezzoMin()));
            }
            if (f.prezzoMax() != null) {
                predicati.add(cb.lessThanOrEqualTo(root.get("prezzo"), f.prezzoMax()));
            }
            if (f.kmMax() != null) {
                predicati.add(cb.lessThanOrEqualTo(root.get("chilometraggio"), f.kmMax()));
            }
            if (f.annoMin() != null) {
                predicati.add(cb.greaterThanOrEqualTo(root.get("anno"), f.annoMin()));
            }
            if (f.annoMax() != null) {
                predicati.add(cb.lessThanOrEqualTo(root.get("anno"), f.annoMax()));
            }
            return cb.and(predicati.toArray(new Predicate[0]));
        };
    }

    private static boolean pieno(String valore) {
        return valore != null && !valore.isBlank();
    }

    private static String minuscolo(String valore) {
        return valore.trim().toLowerCase(Locale.ROOT);
    }

    // % e _ digitati dall'utente vanno cercati come caratteri, non usati come jolly
    static String escapeLike(String valore) {
        return valore.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
    }
}
