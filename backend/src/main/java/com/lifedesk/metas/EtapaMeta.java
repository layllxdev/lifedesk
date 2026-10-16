
package com.lifedesk.metas;

import jakarta.persistence.Embeddable;

@Embeddable
public class EtapaMeta {

    private String titulo;
    private boolean concluida;

    public EtapaMeta() {
    }

    public EtapaMeta(String titulo, boolean concluida) {
        this.titulo = titulo;
        this.concluida = concluida;
    }

    public String getTitulo() {
        return titulo;
    }

    public void setTitulo(String titulo) {
        this.titulo = titulo;
    }

    public boolean isConcluida() {
        return concluida;
    }

    public void setConcluida(boolean concluida) {
        this.concluida = concluida;
    }
}
