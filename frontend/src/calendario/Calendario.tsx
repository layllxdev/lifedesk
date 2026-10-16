
import { useEffect, useState, type FormEvent } from "react";

const API = "https://lifedesk.onrender.com/api/compromissos";

type Compromisso = {
  id: number;
  titulo: string;
  descricao: string | null;
  dataHora: string;
};

function formatarData(data: string) {
  return new Date(data).toLocaleDateString("pt-BR");
}

function formatarHora(data: string) {
  return new Date(data).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function paraCampoData(data: string) {
  return data.slice(0, 16);
}

export default function Calendario() {
  const [compromissos, setCompromissos] = useState<Compromisso[]>([]);
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [dataHora, setDataHora] = useState("");
  const [editando, setEditando] = useState<number | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [confirmarExclusao, setConfirmarExclusao] =
    useState<number | null>(null);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  async function carregarCompromissos() {
    try {
      setErro("");

      const resposta = await fetch(API);

      if (!resposta.ok) {
        throw new Error("Não foi possível carregar os compromissos.");
      }

      const dados: Compromisso[] = await resposta.json();

      setCompromissos(dados);

      // Avisa a página inicial que os compromissos foram atualizados.
      window.dispatchEvent(new Event("compromissosAtualizados"));
    } catch {
      setErro(
        "Não foi possível carregar os compromissos. Confira o backend."
      );
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarCompromissos();
  }, []);

  function limparFormulario() {
    setTitulo("");
    setDescricao("");
    setDataHora("");
    setEditando(null);
  }

  async function salvar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    if (!titulo.trim() || !dataHora) {
      setErro("Preencha o título, a data e o horário.");
      return;
    }

    try {
      setSalvando(true);
      setErro("");
      setMensagem("");

      const dados = {
        titulo: titulo.trim(),
        descricao: descricao.trim(),
        dataHora,
      };

      const resposta = await fetch(
        editando === null ? API : `${API}/${editando}`,
        {
          method: editando === null ? "POST" : "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dados),
        }
      );

      if (!resposta.ok) {
        throw new Error("Não foi possível salvar o compromisso.");
      }

      const estavaEditando = editando !== null;

      limparFormulario();

      setMensagem(
        estavaEditando
          ? "Compromisso atualizado com sucesso!"
          : "Compromisso cadastrado com sucesso!"
      );

      await carregarCompromissos();
    } catch {
      setErro(
        "Não foi possível salvar. Verifique o servidor e tente novamente."
      );
    } finally {
      setSalvando(false);
    }
  }

  function iniciarEdicao(compromisso: Compromisso) {
    setEditando(compromisso.id);
    setTitulo(compromisso.titulo);
    setDescricao(compromisso.descricao ?? "");
    setDataHora(paraCampoData(compromisso.dataHora));
    setErro("");
    setMensagem("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function excluir(id: number) {
    try {
      setExcluindo(true);
      setErro("");
      setMensagem("");

      const resposta = await fetch(`${API}/${id}`, {
        method: "DELETE",
      });

      if (!resposta.ok) {
        throw new Error("Não foi possível excluir o compromisso.");
      }

      if (editando === id) {
        limparFormulario();
      }

      setConfirmarExclusao(null);
      setMensagem("Compromisso excluído com sucesso!");

      await carregarCompromissos();
    } catch {
      setErro("Não foi possível excluir o compromisso.");
    } finally {
      setExcluindo(false);
    }
  }

  const compromissoSelecionado = compromissos.find(
    (compromisso) => compromisso.id === confirmarExclusao
  );

  const hoje = new Date().toLocaleDateString("pt-BR");

  const compromissosDeHoje = compromissos.filter(
    (compromisso) => formatarData(compromisso.dataHora) === hoje
  );

  return (
    <section className="page-content calendario-page">
      <div className="page-title">
        <p className="eyebrow">ORGANIZE SEUS HORÁRIOS</p>
        <h2>Calendário</h2>
        <p>
          Planeje seus compromissos e não esqueça o que é importante.
        </p>
      </div>

      <div className="stats-grid calendario-resumo">
        <article className="stat-card">
          <div className="stat-top">
            <span>Total de compromissos</span>
            <span className="stat-icon">▦</span>
          </div>
          <h3>{compromissos.length}</h3>
          <p>Todos os cadastrados</p>
        </article>

        <article className="stat-card">
          <div className="stat-top">
            <span>Compromissos de hoje</span>
            <span className="stat-icon">◷</span>
          </div>
          <h3>{compromissosDeHoje.length}</h3>
          <p>Agendados para hoje</p>
        </article>
      </div>

      <div className="panel">
        <div className="panel-heading">
          <div>
            <h3>
              {editando === null
                ? "Novo compromisso"
                : "Editar compromisso"}
            </h3>
            <p>Preencha as informações abaixo.</p>
          </div>
        </div>

        <form className="task-form" onSubmit={salvar}>
          <label htmlFor="compromisso-titulo">Título</label>
          <input
            id="compromisso-titulo"
            value={titulo}
            onChange={(evento) => setTitulo(evento.target.value)}
            placeholder="Ex.: Consulta médica"
            required
          />

          <label htmlFor="compromisso-descricao">
            Descrição (opcional)
          </label>
          <textarea
            id="compromisso-descricao"
            value={descricao}
            onChange={(evento) => setDescricao(evento.target.value)}
            placeholder="Adicione detalhes..."
            rows={3}
          />

          <label htmlFor="compromisso-data">Data e horário</label>
          <input
            id="compromisso-data"
            type="datetime-local"
            value={dataHora}
            onChange={(evento) => setDataHora(evento.target.value)}
            required
          />

          {erro && <p className="error-message">{erro}</p>}
          {mensagem && <p className="task-message">{mensagem}</p>}

          <button
            className="primary-button"
            type="submit"
            disabled={salvando}
          >
            {salvando
              ? "Salvando..."
              : editando === null
                ? "+ Cadastrar compromisso"
                : "Salvar alterações"}
          </button>

          {editando !== null && (
            <button
              className="secondary-button"
              type="button"
              onClick={limparFormulario}
            >
              Cancelar edição
            </button>
          )}
        </form>
      </div>

      <div className="panel">
        <div className="panel-heading">
          <div>
            <h3>Meus compromissos</h3>
            <p>Seus eventos em ordem de data e horário.</p>
          </div>
        </div>

        {carregando ? (
          <p className="task-message">Carregando compromissos...</p>
        ) : compromissos.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">▦</div>
            <strong>Nenhum compromisso cadastrado</strong>
            <p>
              Use o formulário acima para planejar seu primeiro evento.
            </p>
          </div>
        ) : (
          <div className="task-list">
            {compromissos.map((compromisso) => (
              <article
                className="task-item compromisso-item"
                key={compromisso.id}
              >
                <div className="compromisso-data">
                  <strong>{formatarData(compromisso.dataHora)}</strong>
                  <span>{formatarHora(compromisso.dataHora)}</span>
                </div>

                <div className="task-details">
                  <strong>{compromisso.titulo}</strong>
                  {compromisso.descricao && (
                    <p>{compromisso.descricao}</p>
                  )}
                </div>

                <div className="compromisso-acoes">
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={() => iniciarEdicao(compromisso)}
                  >
                    Editar
                  </button>

                  <button
                    className="delete-button"
                    type="button"
                    onClick={() => {
                      setErro("");
                      setMensagem("");
                      setConfirmarExclusao(compromisso.id);
                    }}
                  >
                    Excluir
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {confirmarExclusao !== null && compromissoSelecionado && (
        <div
          className="modal-overlay"
          onClick={() => {
            if (!excluindo) {
              setConfirmarExclusao(null);
            }
          }}
        >
          <div
            className="modal-confirmacao"
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-confirmacao"
            onClick={(evento) => evento.stopPropagation()}
          >
            <div className="modal-icone"></div>

            <h3 id="titulo-confirmacao">Excluir compromisso?</h3>

            <p>
              Você deseja excluir{" "}
              <strong>{compromissoSelecionado.titulo}</strong>?
              Essa ação não poderá ser desfeita.
            </p>

            <div className="modal-acoes">
              <button
                className="secondary-button"
                type="button"
                disabled={excluindo}
                onClick={() => setConfirmarExclusao(null)}
              >
                Cancelar
              </button>

              <button
                className="delete-button"
                type="button"
                disabled={excluindo}
                onClick={() => excluir(confirmarExclusao)}
              >
                {excluindo ? "Excluindo..." : "Sim, excluir"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
