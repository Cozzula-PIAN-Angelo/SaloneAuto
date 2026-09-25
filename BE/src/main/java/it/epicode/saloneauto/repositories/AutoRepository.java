package it.epicode.saloneauto.repositories;

import it.epicode.saloneauto.entities.Auto;
import it.epicode.saloneauto.entities.StatoAnnuncio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;

public interface AutoRepository extends JpaRepository<Auto, Long>, JpaSpecificationExecutor<Auto> {

    Optional<Auto> findByIdAndStatoAnnuncio(Long id, StatoAnnuncio statoAnnuncio);

    boolean existsByVin(String vin);

    boolean existsByVinAndIdNot(String vin, Long id);
}
