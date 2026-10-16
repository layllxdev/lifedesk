package com.lifedesk.anotacoes;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "pastas_anotacao")
public class PastaAnotacao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nome;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pasta_pai_id")
    private PastaAnotacao pastaPai;

    @Column(nullable = false)
    private LocalDateTime dataCriacao = LocalDateTime.now();

    public Long getId() {
        return id;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public PastaAnotacao getPastaPai() {
        return pastaPai;
    }

    public void setPastaPai(PastaAnotacao pastaPai) {
        this.pastaPai = pastaPai;
    }

    public LocalDateTime getDataCriacao() {
        return dataCriacao;
    }
}