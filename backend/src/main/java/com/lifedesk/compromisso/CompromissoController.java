
package com.lifedesk.compromisso;

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
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/compromissos")
@CrossOrigin(origins = {
    "http://localhost:5173",
    "https://lifedesk-xi.vercel.app"
})
public class CompromissoController {

    private final CompromissoRepository repository;

    public CompromissoController(CompromissoRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<Compromisso> listarTodos() {
        return repository.findAllByOrderByDataHoraAsc();
    }

    @GetMapping("/proximos")
    public List<Compromisso> listarProximos() {
        return repository.findByDataHoraAfterOrderByDataHoraAsc(
                LocalDateTime.now()
        );
    }

    @GetMapping("/{id}")
    public Compromisso buscarPorId(@PathVariable Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Compromisso não encontrado"
                ));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Compromisso criar(@RequestBody Compromisso compromisso) {
        validar(compromisso);
        return repository.save(compromisso);
    }

    @PutMapping("/{id}")
    public Compromisso atualizar(
            @PathVariable Long id,
            @RequestBody Compromisso dados
    ) {
        Compromisso compromisso = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Compromisso não encontrado"
                ));

        validar(dados);

        compromisso.setTitulo(dados.getTitulo().trim());
        compromisso.setDescricao(dados.getDescricao());
        compromisso.setDataHora(dados.getDataHora());

        return repository.save(compromisso);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluir(@PathVariable Long id) {
        if (!repository.existsById(id)) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Compromisso não encontrado"
            );
        }

        repository.deleteById(id);
    }

    private void validar(Compromisso compromisso) {
        if (compromisso.getTitulo() == null
                || compromisso.getTitulo().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "O título é obrigatório"
            );
        }

        if (compromisso.getDataHora() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "A data e o horário são obrigatórios"
            );
        }
    }
}
