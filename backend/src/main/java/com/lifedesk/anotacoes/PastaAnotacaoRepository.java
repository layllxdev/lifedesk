package com.lifedesk.anotacoes;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface PastaAnotacaoRepository
        extends JpaRepository<PastaAnotacao, Long> {

    List<PastaAnotacao> findByPastaPaiIsNullOrderByNomeAsc();

    List<PastaAnotacao> findByPastaPaiIdOrderByNomeAsc(Long pastaPaiId);
}