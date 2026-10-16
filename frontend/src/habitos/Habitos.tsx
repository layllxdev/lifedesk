
import { useEffect, useState } from "react";

type Habito = {
  id: number;
  titulo: string;
  descricao: string | null;
  frequencia: string;
  dataCriacao: string;
  concluido: boolean;
  sequencia: number;
};

type Resumo = {
  total: number;
  concluidos: number;
  pendentes: number;
  progresso: number;
};

const API = "https://lifedesk.onrender.com/api/habitos";

function dataLocal(): string {
  const agora = new Date();
  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  const dia = String(agora.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

export default function Habitos() {
  const [habitos, setHabitos] = useState<Habito[]>([]);
  const [resumo, setResumo] = useState<Resumo>({
    total: 0,
    concluidos: 0,
    pendentes: 0,
    progresso: 0,
  });

  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [frequencia, setFrequencia] = useState("DIARIA");
  const [editando, setEditando] = useState<number | null>(null);
  const [data, setData] = useState(dataLocal());
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  async function carregar() {
    setCarregando(true);
    setErro("");

    try {
      const [respostaHabitos, respostaResumo] = await Promise.all([
        fetch(`${API}?data=${data}`),
        fetch(`${API}/resumo?data=${data}`),
      ]);

      if (!respostaHabitos.ok || !respostaResumo.ok) {
        throw new Error("Não foi possível carregar os hábitos.");
      }

      const lista: Habito[] = await respostaHabitos.json();
      const dadosResumo: Resumo = await respostaResumo.json();

      setHabitos(lista);
      setResumo(dadosResumo);
    } catch {
      setErro(
        "Não foi possível conectar ao servidor. Verifique se o backend está funcionando."
      );
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    void carregar();
  }, [data]);

  async function salvar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    if (!titulo.trim()) {
      setErro("Digite o nome do hábito.");
      return;
    }

    setErro("");

    try {
      const url = editando === null ? API : `${API}/${editando}`;
      const metodo = editando === null ? "POST" : "PUT";

      const resposta = await fetch(url, {
        method: metodo,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo: titulo.trim(),
          descricao: descricao.trim(),
          frequencia,
        }),
      });

      if (!resposta.ok) {
        throw new Error("Não foi possível salvar o hábito.");
      }

      limparFormulario();
      await carregar();
    } catch {
      setErro("Erro ao salvar o hábito. Verifique o servidor.");
    }
  }

  function limparFormulario() {
    setTitulo("");
    setDescricao("");
    setFrequencia("DIARIA");
    setEditando(null);
  }

  function iniciarEdicao(habito: Habito) {
    setTitulo(habito.titulo);
    setDescricao(habito.descricao ?? "");
    setFrequencia(habito.frequencia);
    setEditando(habito.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function alternarConclusao(id: number) {
    setErro("");

    try {
      const resposta = await fetch(
        `${API}/${id}/concluir?data=${data}`,
        { method: "PUT" }
      );

      if (!resposta.ok) {
        throw new Error("Falha ao atualizar o hábito.");
      }

      await carregar();
    } catch {
      setErro("Não foi possível atualizar a conclusão.");
    }
  }

  async function excluir(id: number) {
    const confirmado = window.confirm(
      "Deseja excluir este hábito e seu histórico de conclusões?"
    );

    if (!confirmado) return;

    setErro("");

    try {
      const resposta = await fetch(`${API}/${id}`, {
        method: "DELETE",
      });

      if (!resposta.ok) {
        throw new Error("Falha ao excluir o hábito.");
      }

      if (editando === id) limparFormulario();

      await carregar();
    } catch {
      setErro("Não foi possível excluir o hábito.");
    }
  }

  return (
    <main className="page-content">
      <div className="page-title">
        <span className="eyebrow">ROTINA E CONSISTÊNCIA</span>
        <h1>Hábitos</h1>
        <p>
          Pequenas ações todos os dias constroem grandes resultados.
        </p>
      </div>

      <section className="panel">
        <div className="panel-heading">
          <h2>Seu progresso</h2>
          <label>
            Data
            <input
              type="date"
              value={data}
              onChange={(evento) => setData(evento.target.value)}
            />
          </label>
        </div>

        <div className="habitos-resumo">
          <div>
            <span>Total de hábitos</span>
            <strong>{resumo.total}</strong>
          </div>
          <div>
            <span>Concluídos</span>
            <strong>{resumo.concluidos}</strong>
          </div>
          <div>
            <span>Pendentes</span>
            <strong>{resumo.pendentes}</strong>
          </div>
        </div>

        <div className="habitos-progresso">
          <div className="habitos-progresso-texto">
            <span>Progresso do dia</span>
            <strong>{resumo.progresso}%</strong>
          </div>
          <div
            className="habitos-barra"
            role="progressbar"
            aria-valuenow={resumo.progresso}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div style={{ width: `${resumo.progresso}%` }} />
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <h2>{editando === null ? "Novo hábito" : "Editar hábito"}</h2>
        </div>

        <form className="task-form" onSubmit={salvar}>
          <label>
            Nome do hábito
            <input
              value={titulo}
              onChange={(evento) => setTitulo(evento.target.value)}
              placeholder="Ex.: Estudar Python"
              maxLength={120}
              required
            />
          </label>

          <label>
            Descrição (opcional)
            <input
              value={descricao}
              onChange={(evento) => setDescricao(evento.target.value)}
              placeholder="Ex.: Estudar por 30 minutos"
            />
          </label>

          <label>
            Frequência
            <select
              value={frequencia}
              onChange={(evento) => setFrequencia(evento.target.value)}
            >
              <option value="DIARIA">Todos os dias</option>
              <option value="DIAS_UTEIS">Dias úteis</option>
              <option value="SEMANAL">Semanal</option>
            </select>
          </label>

          <div className="habitos-acoes-form">
            <button className="primary-button" type="submit">
              {editando === null ? "Adicionar hábito" : "Salvar alterações"}
            </button>

            {editando !== null && (
              <button
                className="secondary-button"
                type="button"
                onClick={limparFormulario}
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </section>

      {erro && <p className="error-message">{erro}</p>}

      <section className="panel">
        <div className="panel-heading">
          <h2>Minha rotina</h2>
          <span>{habitos.length} hábitos</span>
        </div>

        {carregando ? (
          <p className="empty-state">Carregando hábitos...</p>
        ) : habitos.length === 0 ? (
          <div className="empty-state">
            Você ainda não cadastrou hábitos. Comece com um pequeno objetivo!
          </div>
        ) : (
          <div className="task-list">
            {habitos.map((habito) => (
              <article className="task-item" key={habito.id}>
                <label className="habito-conclusao">
                  <input
                    type="checkbox"
                    checked={habito.concluido}
                    onChange={() => void alternarConclusao(habito.id)}
                  />
                  <span>
                    <strong
                      className={
                        habito.concluido ? "habito-concluido" : ""
                      }
                    >
                      {habito.titulo}
                    </strong>
                    {habito.descricao && <small>{habito.descricao}</small>}
                    <small>
                      {habito.frequencia === "DIARIA"
                        ? "Todos os dias"
                        : habito.frequencia === "DIAS_UTEIS"
                          ? "Dias úteis"
                          : "Semanal"}
                    </small>
                  </span>
                </label>

                <div className="habito-lado">
                  <span className="habito-sequencia">
                    🔥 {habito.sequencia}{" "}
                    {habito.sequencia === 1 ? "dia" : "dias"}
                  </span>

                  <div className="habito-botoes">
                    <button
                      className="secondary-button"
                      type="button"
                      onClick={() => iniciarEdicao(habito)}
                    >
                      Editar
                    </button>
                    <button
                      className="delete-button"
                      type="button"
                      onClick={() => void excluir(habito.id)}
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
