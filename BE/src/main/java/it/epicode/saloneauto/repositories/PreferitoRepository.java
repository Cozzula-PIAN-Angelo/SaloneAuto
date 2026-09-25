package it.epicode.saloneauto.repositories;

import it.epicode.saloneauto.entities.Preferito;
import it.epicode.saloneauto.entities.StatoAnnuncio;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PreferitoRepository extends JpaRepository<Preferito, Long> {

    // Sempre id + proprietario insieme: il preferito di un altro utente risulta inesistente
    Optional<Preferito> findByIdAndUtenteId(Long id, Long utenteId);

    // L'auto si carica nella stessa query: senza, una query in più per ogni preferito (N+1)
    @EntityGraph(attributePaths = "auto")
    List<Preferito> findByUtenteIdAndAutoStatoAnnuncioOrderByDataAggiuntaDesc(Long utenteId, StatoAnnuncio stato);

    boolean existsByUtenteIdAndAutoId(Long utenteId, Long autoId);
}
