
package com.lifedesk.financas;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface LancamentoRepository
        extends JpaRepository<Lancamento, Long> {

    List<Lancamento> findByCategoriaIgnoreCase(String categoria);
}
