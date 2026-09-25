package it.epicode.saloneauto.repositories;

import it.epicode.saloneauto.entities.Avviso;
import it.epicode.saloneauto.entities.StatoAnnuncio;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

public interface AvvisoRepository extends JpaRepository<Avviso, Long> {

    // Sempre id + proprietario insieme: l'avviso di un altro utente risulta inesistente
    Optional<Avviso> findByIdAndUtenteId(Long id, Long utenteId);

    Optional<Avviso> findByIdAndUtenteIdAndAutoStatoAnnuncio(Long id, Long utenteId, StatoAnnuncio stato);

    // L'auto si carica nella stessa query: senza, una query in più per ogni avviso (N+1)
    @EntityGraph(attributePaths = "auto")
    List<Avviso> findByUtenteIdAndAutoStatoAnnuncioOrderByDataCreazioneDesc(Long utenteId, StatoAnnuncio stato);

    boolean existsByUtenteIdAndAutoId(Long utenteId, Long autoId);

    Optional<Avviso> findByTokenDisattivazioneHash(String tokenDisattivazioneHash);

    @Modifying
    @Query("delete from Avviso a where a.utente.id = :utenteId and a.auto.id = :autoId")
    void deleteByUtenteIdAndAutoId(@Param("utenteId") Long utenteId, @Param("autoId") Long autoId);

    /**
     * Avvisi attivi per cui il prezzo ha appena attraversato la soglia verso il basso:
     * prima era >= soglia, ora è < soglia. Chi era già sotto soglia non viene notificato di nuovo.
     */
    @Query("""
            select a from Avviso a
            join fetch a.utente
            join fetch a.auto
            where a.auto.id = :autoId
              and a.attivo = true
              and a.soglia > :prezzoNuovo
              and a.soglia <= :prezzoVecchio
            """)
    List<Avviso> findDaNotificare(@Param("autoId") Long autoId,
                                  @Param("prezzoVecchio") BigDecimal prezzoVecchio,
                                  @Param("prezzoNuovo") BigDecimal prezzoNuovo);
}
