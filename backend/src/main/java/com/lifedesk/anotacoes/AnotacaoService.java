package com.lifedesk.anotacoes;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AnotacaoService {

    private final AnotacaoRepository anotacaoRepository;
    private final PastaAnotacaoRepository pastaRepository;

    public AnotacaoService(
            AnotacaoRepository anotacaoRepository,
            PastaAnotacaoRepository pastaRepository) {
        this.anotacaoRepository = anotacaoRepository;
        this.pastaRepository = pastaRepository;
    }

    public List<Anotacao> listar(Long pastaId) {
        if (pastaId == null) {
            return anotacaoRepository.findByPastaIsNullOrderByDataAtualizacaoDesc();
        }

        return anotacaoRepository.findByPastaIdOrderByDataAtualizacaoDesc(pastaId);
    }

    public List<Anotacao> pesquisar(String termo) {
        return anotacaoRepository
            .findByTituloContainingIgnoreCaseOrConteudoContainingIgnoreCaseOrderByDataAtualizacaoDesc(
                termo, termo
            );
    }

    public Anotacao buscar(Long id) {
        return anotacaoRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException(
                "Anotação não encontrada."
            ));
    }

    public Anotacao salvar(Anotacao dados, Long pastaId) {
        if (dados.getTitulo() == null || dados.getTitulo().isBlank()) {
            throw new IllegalArgumentException("O título é obrigatório.");
        }

        if (pastaId == null) {
            dados.setPasta(null);
        } else {
            PastaAnotacao pasta = pastaRepository.findById(pastaId)
                .orElseThrow(() -> new IllegalArgumentException(
                    "Pasta não encontrada."
                ));

            dados.setPasta(pasta);
        }

        return anotacaoRepository.save(dados);
    }

    @Transactional
    public void excluir(Long id) {
        anotacaoRepository.delete(buscar(id));
    }

    public List<PastaAnotacao> listarPastas(Long pastaPaiId) {
        if (pastaPaiId == null) {
            return pastaRepository.findByPastaPaiIsNullOrderByNomeAsc();
        }

        return pastaRepository.findByPastaPaiIdOrderByNomeAsc(pastaPaiId);
    }

    public PastaAnotacao salvarPasta(String nome, Long pastaPaiId) {
        if (nome == null || nome.isBlank()) {
            throw new IllegalArgumentException("O nome da pasta é obrigatório.");
        }

        PastaAnotacao pasta = new PastaAnotacao();
        pasta.setNome(nome.trim());

        if (pastaPaiId != null) {
            PastaAnotacao pai = pastaRepository.findById(pastaPaiId)
                .orElseThrow(() -> new IllegalArgumentException(
                    "Pasta principal não encontrada."
                ));

            pasta.setPastaPai(pai);
        }

        return pastaRepository.save(pasta);
    }

    @Transactional
    public PastaAnotacao renomearPasta(Long id, String nome) {
        if (nome == null || nome.isBlank()) {
            throw new IllegalArgumentException("O nome da pasta é obrigatório.");
        }

        PastaAnotacao pasta = pastaRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException(
                "Pasta não encontrada."
            ));

        pasta.setNome(nome.trim());
        return pastaRepository.save(pasta);
    }

    @Transactional
    public void excluirPasta(Long id) {
        PastaAnotacao pasta = pastaRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException(
                "Pasta não encontrada."
            ));

        excluirPastaRecursivamente(pasta);
    }

    private void excluirPastaRecursivamente(PastaAnotacao pasta) {
        List<PastaAnotacao> filhas =
            pastaRepository.findByPastaPaiIdOrderByNomeAsc(pasta.getId());

        for (PastaAnotacao filha : filhas) {
            excluirPastaRecursivamente(filha);
        }

        List<Anotacao> anotacoes =
            anotacaoRepository.findByPastaIdOrderByDataAtualizacaoDesc(
                pasta.getId()
            );

        anotacaoRepository.deleteAll(anotacoes);
        pastaRepository.delete(pasta);
    }
}