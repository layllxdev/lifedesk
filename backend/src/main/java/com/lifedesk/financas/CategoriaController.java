
package com.lifedesk.financas;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/categorias")
@CrossOrigin(origins = "http://localhost:5173")
public class CategoriaController {

    private final CategoriaRepository repository;
    private final LancamentoRepository lancamentoRepository;

    public CategoriaController(
            CategoriaRepository repository,
            LancamentoRepository lancamentoRepository) {
        this.repository = repository;
        this.lancamentoRepository = lancamentoRepository;
    }

    @GetMapping
    public List<Categoria> listar() {
        if (repository.count() == 0) {
            List<String> padrao = List.of(
                "Alimentação",
                "Transporte",
                "Estudos",
                "Saúde",
                "Lazer",
                "Moradia",
                "Salário",
                "Bolsa de estudos",
                "Contas",
                "Compras",
                "Gastos do casal",
                "Outros"
            );

            padrao.forEach(nome ->
                repository.save(new Categoria(nome))
            );
        }

        return repository.findAll()
            .stream()
            .sorted((a, b) ->
                a.getNome().compareToIgnoreCase(b.getNome()))
            .toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Categoria criar(@RequestBody Categoria categoria) {
        if (categoria.getNome() == null
                || categoria.getNome().isBlank()) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Informe o nome da categoria."
            );
        }

        String nome = categoria.getNome().trim();

        if (repository.findByNomeIgnoreCase(nome).isPresent()) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "Essa categoria já existe."
            );
        }

        categoria.setNome(nome);
        return repository.save(categoria);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluir(@PathVariable Long id) {
        Categoria categoria = repository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Categoria não encontrada."
            ));

        boolean possuiLancamentos = !lancamentoRepository
            .findByCategoriaIgnoreCase(categoria.getNome())
            .isEmpty();

        if (possuiLancamentos) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "Não é possível excluir esta categoria porque ela está sendo usada em lançamentos financeiros."
            );
        }

        repository.delete(categoria);
    }
}
