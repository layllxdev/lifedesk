
package com.lifedesk.habitos;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface RegistroHabitoRepository
        extends JpaRepository<RegistroHabito, Long> {

    Optional<RegistroHabito> findByHabitoIdAndData(
        Long habitoId,
        LocalDate data
    );

    List<RegistroHabito> findByData(LocalDate data);

    List<RegistroHabito> findByHabitoIdOrderByDataDesc(Long habitoId);
}
