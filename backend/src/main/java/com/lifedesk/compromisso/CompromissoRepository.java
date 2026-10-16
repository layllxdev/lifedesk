
package com.lifedesk.compromisso;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface CompromissoRepository
        extends JpaRepository<Compromisso, Long> {

    List<Compromisso> findAllByOrderByDataHoraAsc();

    List<Compromisso> findByDataHoraAfterOrderByDataHoraAsc(
            LocalDateTime dataHora
    );
}
