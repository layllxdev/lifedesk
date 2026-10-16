package com.lifedesk.tarefa;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/tarefas")
@CrossOrigin(origins = {
    "http://localhost:5173",
    "https://lifedesk-xi.vercel.app"
})
public class TarefaController {

    private final TarefaRepository repository;

    public TarefaController(TarefaRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<Tarefa> listar() {
        return repository.findAll();
    }

    @PostMapping
    public ResponseEntity<Tarefa> cadastrar(
            @Valid @RequestBody Tarefa tarefa) {

        tarefa.setConcluida(false);

        Tarefa salva = repository.save(tarefa);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(salva);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Tarefa> editar(
            @PathVariable Long id,
            @Valid @RequestBody Tarefa dados) {

        return repository.findById(id)
                .map(tarefa -> {
                    tarefa.setTitulo(dados.getTitulo());
                    tarefa.setDescricao(dados.getDescricao());

                    Tarefa atualizada = repository.save(tarefa);

                    return ResponseEntity.ok(atualizada);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/concluir")
    public ResponseEntity<Tarefa> concluir(
            @PathVariable Long id) {

        return repository.findById(id)
                .map(tarefa -> {
                    tarefa.setConcluida(!tarefa.isConcluida());

                    Tarefa atualizada = repository.save(tarefa);

                    return ResponseEntity.ok(atualizada);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(
            @PathVariable Long id) {

        if (!repository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        repository.deleteById(id);

        return ResponseEntity.noContent().build();
    }
}
