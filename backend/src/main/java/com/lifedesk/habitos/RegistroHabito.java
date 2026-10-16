
package com.lifedesk.habitos;

import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(
    name = "registros_habito",
    uniqueConstraints = @UniqueConstraint(
        columnNames = {"habito_id", "data"}
    )
)
public class RegistroHabito {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "habito_id", nullable = false)
    private Habito habito;

    @Column(name = "data", nullable = false)
    private LocalDate data;

    public RegistroHabito() {
    }

    public RegistroHabito(Habito habito, LocalDate data) {
        this.habito = habito;
        this.data = data;
    }

    public Long getId() {
        return id;
    }

    public Habito getHabito() {
        return habito;
    }

    public void setHabito(Habito habito) {
        this.habito = habito;
    }

    public LocalDate getData() {
        return data;
    }

    public void setData(LocalDate data) {
        this.data = data;
    }
}
