
package com.lifedesk.metas;

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
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/metas")
@CrossOrigin(origins = "http://localhost:5173")
public class MetaController {

    private final MetaRepository repository;

    public MetaController(MetaRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<Meta> listar() {
        return repository.findAll();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Meta criar(@RequestBody Meta meta) {
        validar(meta);
        meta.setId(null);
        atualizarProgresso(meta);
        return repository.save(meta);
    }

    @PutMapping("/{id}")
    public Meta atualizar(
        @PathVariable Long id,
        @RequestBody Meta dados
    ) {
        Meta meta = repository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND, "Meta não encontrada."
            ));

        validar(dados);

        meta.setTitulo(dados.getTitulo().trim());
        meta.setDescricao(dados.getDescricao());
        meta.setPrazo(dados.getPrazo());
        meta.setModo(dados.getModo());
        meta.setProgresso(dados.getProgresso());
        meta.setConcluida(dados.isConcluida());
        meta.setEtapas(dados.getEtapas());

        atualizarProgresso(meta);
        return repository.save(meta);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluir(@PathVariable Long id) {
        if (!repository.existsById(id)) {
            throw new ResponseStatusException(
                HttpStatus.NOT_FOUND, "Meta não encontrada."
            );
        }

        repository.deleteById(id);
    }

    private void validar(Meta meta) {
        if (meta.getTitulo() == null || meta.getTitulo().isBlank()) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST, "Informe o título da meta."
            );
        }

        if (meta.getModo() == null ||
            !(meta.getModo().equals("MANUAL")
                || meta.getModo().equals("TAREFAS"))) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "O modo deve ser MANUAL ou TAREFAS."
            );
        }

        if (meta.getProgresso() < 0 || meta.getProgresso() > 100) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "O progresso deve estar entre 0 e 100."
            );
        }

        if (meta.getEtapas() != null) {
            for (EtapaMeta etapa : meta.getEtapas()) {
                if (etapa.getTitulo() == null ||
                    etapa.getTitulo().isBlank()) {
                    throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Todas as etapas precisam de um título."
                    );
                }
            }
        }
    }

    private void atualizarProgresso(Meta meta) {
        if ("TAREFAS".equals(meta.getModo())) {
            List<EtapaMeta> etapas = meta.getEtapas();

            if (etapas == null || etapas.isEmpty()) {
                meta.setProgresso(0);
            } else {
                long concluidas = etapas.stream()
                    .filter(EtapaMeta::isConcluida)
                    .count();

                meta.setProgresso(
                    (int) Math.round(
                        concluidas * 100.0 / etapas.size()
                    )
                );
            }
        }

        meta.setConcluida(meta.getProgresso() == 100);
    }
}
