package com.lifedesk.anotacoes;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/anotacoes")
@CrossOrigin(origins = "http://localhost:5173")
public class AnotacaoController {

    private final AnotacaoService service;

    public AnotacaoController(AnotacaoService service) {
        this.service = service;
    }

    @GetMapping
    public List<AnotacaoResposta> listar(
            @RequestParam(required = false) Long pastaId,
            @RequestParam(required = false) String busca) {

        List<Anotacao> lista =
                busca != null && !busca.isBlank()
                        ? service.pesquisar(busca.trim())
                        : service.listar(pastaId);

        return lista.stream().map(this::converter).toList();
    }

    @GetMapping("/{id}")
    public AnotacaoResposta buscar(@PathVariable Long id) {
        return converter(service.buscar(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AnotacaoResposta criar(@RequestBody DadosAnotacao dados) {
        Anotacao anotacao = new Anotacao();
        anotacao.setTitulo(dados.titulo());
        anotacao.setConteudo(dados.conteudo());

        return converter(service.salvar(anotacao, dados.pastaId()));
    }

    @PutMapping("/{id}")
    public AnotacaoResposta editar(
            @PathVariable Long id,
            @RequestBody DadosAnotacao dados) {

        Anotacao anotacao = service.buscar(id);
        anotacao.setTitulo(dados.titulo());
        anotacao.setConteudo(dados.conteudo());

        return converter(service.salvar(anotacao, dados.pastaId()));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluir(@PathVariable Long id) {
        service.excluir(id);
    }

    @GetMapping("/pastas")
    public List<PastaResposta> listarPastas(
            @RequestParam(required = false) Long pastaPaiId) {

        return service.listarPastas(pastaPaiId)
                .stream()
                .map(this::converterPasta)
                .toList();
    }

    @PostMapping("/pastas")
    @ResponseStatus(HttpStatus.CREATED)
    public PastaResposta criarPasta(@RequestBody DadosPasta dados) {
        return converterPasta(
                service.salvarPasta(dados.nome(), dados.pastaPaiId())
        );
    }

    @PutMapping("/pastas/{id}")
    public PastaResposta renomearPasta(
            @PathVariable Long id,
            @RequestBody DadosPasta dados) {

        return converterPasta(
                service.renomearPasta(id, dados.nome())
        );
    }

    @DeleteMapping("/pastas/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluirPasta(@PathVariable Long id) {
        service.excluirPasta(id);
    }

    private AnotacaoResposta converter(Anotacao anotacao) {
        Long pastaId = anotacao.getPasta() == null
                ? null
                : anotacao.getPasta().getId();

        return new AnotacaoResposta(
                anotacao.getId(),
                anotacao.getTitulo(),
                anotacao.getConteudo(),
                pastaId,
                anotacao.getDataCriacao(),
                anotacao.getDataAtualizacao()
        );
    }

    private PastaResposta converterPasta(PastaAnotacao pasta) {
        Long pastaPaiId = pasta.getPastaPai() == null
                ? null
                : pasta.getPastaPai().getId();

        return new PastaResposta(
                pasta.getId(),
                pasta.getNome(),
                pastaPaiId,
                pasta.getDataCriacao()
        );
    }

    public record DadosAnotacao(
            String titulo,
            String conteudo,
            Long pastaId
    ) {}

    public record DadosPasta(
            String nome,
            Long pastaPaiId
    ) {}

    public record AnotacaoResposta(
            Long id,
            String titulo,
            String conteudo,
            Long pastaId,
            LocalDateTime dataCriacao,
            LocalDateTime dataAtualizacao
    ) {}

    public record PastaResposta(
            Long id,
            String nome,
            Long pastaPaiId,
            LocalDateTime dataCriacao
    ) {}
}