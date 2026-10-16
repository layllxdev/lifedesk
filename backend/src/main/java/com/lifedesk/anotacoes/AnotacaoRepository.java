package com.lifedesk.anotacoes;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface AnotacaoRepository
        extends JpaRepository<Anotacao, Long> {

    List<Anotacao> findByPastaIdOrderByDataAtualizacaoDesc(Long pastaId);

    List<Anotacao> findByPastaIsNullOrderByDataAtualizacaoDesc();

    List<Anotacao>
        findByTituloContainingIgnoreCaseOrConteudoContainingIgnoreCaseOrderByDataAtualizacaoDesc(
            String titulo,
            String conteudo
        );
}