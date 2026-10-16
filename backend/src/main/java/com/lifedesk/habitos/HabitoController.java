
package com.lifedesk.habitos;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.format.annotation.DateTimeFormat;
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
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/habitos")
@CrossOrigin(origins = "http://localhost:5173")
public class HabitoController {

    private final HabitoRepository habitoRepository;
    private final RegistroHabitoRepository registroRepository;

    public HabitoController(
            HabitoRepository habitoRepository,
            RegistroHabitoRepository registroRepository) {
        this.habitoRepository = habitoRepository;
        this.registroRepository = registroRepository;
    }

    @GetMapping
    public List<Map<String, Object>> listar(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate data) {

        LocalDate hoje = data != null ? data : LocalDate.now();

        return habitoRepository.findByAtivoTrueOrderByIdDesc()
                .stream()
                .map(habito -> montarResposta(habito, hoje))
                .collect(Collectors.toList());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> criar(@RequestBody Habito entrada) {
        validar(entrada);

        entrada.setId(null);
        entrada.setTitulo(entrada.getTitulo().trim());
        entrada.setAtivo(true);
        entrada.setDataCriacao(LocalDate.now());

        if (entrada.getFrequencia() == null
                || entrada.getFrequencia().isBlank()) {
            entrada.setFrequencia("DIARIA");
        }

        Habito salvo = habitoRepository.save(entrada);
        return montarResposta(salvo, LocalDate.now());
    }

    @PutMapping("/{id}")
    public Map<String, Object> atualizar(
            @PathVariable Long id,
            @RequestBody Habito entrada) {

        validar(entrada);

        Habito existente = buscarHabito(id);
        existente.setTitulo(entrada.getTitulo().trim());
        existente.setDescricao(entrada.getDescricao());

        if (entrada.getFrequencia() != null
                && !entrada.getFrequencia().isBlank()) {
            existente.setFrequencia(entrada.getFrequencia());
        }

        Habito salvo = habitoRepository.save(existente);
        return montarResposta(salvo, LocalDate.now());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluir(@PathVariable Long id) {
        Habito habito = buscarHabito(id);

        registroRepository.deleteAll(
            registroRepository.findByHabitoIdOrderByDataDesc(id)
        );

        habitoRepository.delete(habito);
    }

    @PutMapping("/{id}/concluir")
    public Map<String, Object> alternarConclusao(
            @PathVariable Long id,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate data) {

        LocalDate dia = data != null ? data : LocalDate.now();
        Habito habito = buscarHabito(id);

        Optional<RegistroHabito> registro =
            registroRepository.findByHabitoIdAndData(id, dia);

        if (registro.isPresent()) {
            registroRepository.delete(registro.get());
        } else {
            registroRepository.save(new RegistroHabito(habito, dia));
        }

        return montarResposta(habito, dia);
    }

    @GetMapping("/resumo")
    public Map<String, Object> resumo(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate data) {

        LocalDate hoje = data != null ? data : LocalDate.now();
        List<Habito> habitos =
            habitoRepository.findByAtivoTrueOrderByIdDesc();

        long concluidos = habitos.stream()
            .filter(h -> registroRepository
                .findByHabitoIdAndData(h.getId(), hoje).isPresent())
            .count();

        Map<String, Object> resultado = new LinkedHashMap<>();
        resultado.put("total", habitos.size());
        resultado.put("concluidos", concluidos);
        resultado.put("pendentes", habitos.size() - concluidos);
        resultado.put("progresso", habitos.isEmpty()
            ? 0 : Math.round(concluidos * 100.0 / habitos.size()));

        return resultado;
    }

    private Habito buscarHabito(Long id) {
        return habitoRepository.findById(id)
            .filter(Habito::isAtivo)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND, "Hábito não encontrado"
            ));
    }

    private void validar(Habito habito) {
        if (habito.getTitulo() == null
                || habito.getTitulo().isBlank()) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST, "O título é obrigatório"
            );
        }

        if (habito.getTitulo().trim().length() > 120) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "O título deve ter no máximo 120 caracteres"
            );
        }
    }

    private Map<String, Object> montarResposta(
            Habito habito, LocalDate data) {

        boolean concluido = registroRepository
            .findByHabitoIdAndData(habito.getId(), data)
            .isPresent();

        List<RegistroHabito> registros =
            registroRepository.findByHabitoIdOrderByDataDesc(
                habito.getId()
            );

        Set<LocalDate> datas = registros.stream()
            .map(RegistroHabito::getData)
            .collect(Collectors.toSet());

        int sequencia = 0;
        LocalDate dia = data;

        while (datas.contains(dia)) {
            sequencia++;
            dia = dia.minusDays(1);
        }

        Map<String, Object> resposta = new LinkedHashMap<>();
        resposta.put("id", habito.getId());
        resposta.put("titulo", habito.getTitulo());
        resposta.put("descricao", habito.getDescricao());
        resposta.put("frequencia", habito.getFrequencia());
        resposta.put("dataCriacao", habito.getDataCriacao());
        resposta.put("concluido", concluido);
        resposta.put("sequencia", sequencia);

        return resposta;
    }
}
