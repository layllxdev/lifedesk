
package com.lifedesk.metas;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.Table;

@Entity
@Table(name = "metas")
public class Meta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String titulo;

    @Column(length = 2000)
    private String descricao;

    private LocalDate prazo;

    @Column(nullable = false)
    private String modo = "MANUAL";

    @Column(nullable = false)
    private int progresso = 0;

    @Column(nullable = false)
    private boolean concluida = false;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(
    name = "etapas_meta",
    joinColumns = @JoinColumn(name = "meta_id")
    )
    @OrderColumn(name = "ordem")
    private List<EtapaMeta> etapas = new ArrayList<>();

    public Meta() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitulo() {
        return titulo;
    }

    public void setTitulo(String titulo) {
        this.titulo = titulo;
    }

    public String getDescricao() {
        return descricao;
    }

    public void setDescricao(String descricao) {
        this.descricao = descricao;
    }

    public LocalDate getPrazo() {
        return prazo;
    }

    public void setPrazo(LocalDate prazo) {
        this.prazo = prazo;
    }

    public String getModo() {
        return modo;
    }

    public void setModo(String modo) {
        this.modo = modo;
    }

    public int getProgresso() {
        return progresso;
    }

    public void setProgresso(int progresso) {
        this.progresso = progresso;
    }

    public boolean isConcluida() {
        return concluida;
    }

    public void setConcluida(boolean concluida) {
        this.concluida = concluida;
    }

    public List<EtapaMeta> getEtapas() {
        return etapas;
    }

    public void setEtapas(List<EtapaMeta> etapas) {
        this.etapas = etapas == null
            ? new ArrayList<>()
            : new ArrayList<>(etapas);
    }
}
