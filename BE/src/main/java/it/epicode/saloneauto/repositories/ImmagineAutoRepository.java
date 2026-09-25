package it.epicode.saloneauto.repositories;

import it.epicode.saloneauto.entities.ImmagineAuto;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ImmagineAutoRepository extends JpaRepository<ImmagineAuto, Long> {

    Optional<ImmagineAuto> findByIdAndAutoId(Long id, Long autoId);
}
