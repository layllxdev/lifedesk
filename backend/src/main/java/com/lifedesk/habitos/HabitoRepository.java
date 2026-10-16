
package com.lifedesk.habitos;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface HabitoRepository extends JpaRepository<Habito, Long> {

    List<Habito> findByAtivoTrueOrderByIdDesc();
}
