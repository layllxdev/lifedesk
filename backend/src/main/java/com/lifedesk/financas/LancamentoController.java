package com.lifedesk.financas;

import java.math.BigDecimal;
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
@RequestMapping("/api/lancamentos")
@CrossOrigin(origins = {
    "http://localhost:5173",
    "https://lifedesk-xi.vercel.app"
})
public class LancamentoController {

    private final LancamentoRepository repository;

    public LancamentoController(LancamentoRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<Lancamento> listar() {
        return repository.findAll();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Lancamento cadastrar(@RequestBody Lancamento lancamento) {
        validar(lancamento);

        lancamento.setId(null);

        return repository.save(lancamento);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluir(@PathVariable Long id) {
        if (!repository.existsById(id)) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Lançamento não encontrado"
            );
        }

        repository.deleteById(id);
    }

    private void validar(Lancamento lancamento) {
        if (lancamento.getDescricao() == null
                || lancamento.getDescricao().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "A descrição é obrigatória"
            );
        }

        if (lancamento.getValor() == null
                || lancamento.getValor().compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "O valor deve ser maior que zero"
            );
        }

        if (lancamento.getTipo() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "O tipo do lançamento é obrigatório"
            );
        }

        if (lancamento.getData() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "A data é obrigatória"
            );
        }

        if (lancamento.getCategoria() == null
                || lancamento.getCategoria().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "A categoria é obrigatória"
            );
        }
    }
}