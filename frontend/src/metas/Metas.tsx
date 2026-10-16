
import { useEffect, useState, type FormEvent } from "react";

const API = "https://lifedesk.onrender.com/api/metas";

type Etapa = {
  titulo: string;
  concluida: boolean;
};

type Meta = {
  id: number;
  titulo: string;
  descricao: string;
  prazo: string | null;
  modo: "MANUAL" | "TAREFAS";
  progresso: number;
  concluida: boolean;
  etapas: Etapa[];
};

const metaVazia = {
  titulo: "",
  descricao: "",
  prazo: "",
  modo: "MANUAL" as "MANUAL" | "TAREFAS",
  progresso: 0,
  etapas: [] as Etapa[],
};

export default function Metas() {
  const [metas, setMetas] = useState<Meta[]>([]);
  const [formulario, setFormulario] = useState(metaVazia);
  const [novaEtapa, setNovaEtapa] = useState("");
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  async function carregarMetas() {
    setErro("");

    try {
      const resposta = await fetch(API);

      if (!resposta.ok) {
        throw new Error("Não foi possível carregar as metas.");
      }

      const dados: Meta[] = await resposta.json();
      setMetas(dados);
    } catch (e) {
      setErro(
        e instanceof Error ? e.message : "Erro ao carregar as metas."
      );
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    void carregarMetas();
  }, []);

  function atualizarCampo(
    campo: "titulo" | "descricao" | "prazo" | "modo" | "progresso",
    valor: string | number
  ) {
    setFormulario((atual) => ({ ...atual, [campo]: valor }));
  }

  function adicionarEtapa() {
    const titulo = novaEtapa.trim();

    if (!titulo) return;

    setFormulario((atual) => ({
      ...atual,
      etapas: [...atual.etapas, { titulo, concluida: false }],
    }));

    setNovaEtapa("");
  }

  function alternarEtapa(indice: number) {
    setFormulario((atual) => ({
      ...atual,
      etapas: atual.etapas.map((etapa, i) =>
        i === indice ? { ...etapa, concluida: !etapa.concluida } : etapa
      ),
    }));
  }

  function removerEtapa(indice: number) {
    setFormulario((atual) => ({
      ...atual,
      etapas: atual.etapas.filter((_, i) => i !== indice),
    }));
  }

  function limparFormulario() {
    setFormulario(metaVazia);
    setNovaEtapa("");
    setEditandoId(null);
    setErro("");
  }

  function editarMeta(meta: Meta) {
    setEditandoId(meta.id);
    setFormulario({
      titulo: meta.titulo,
      descricao: meta.descricao ?? "",
      prazo: meta.prazo ?? "",
      modo: meta.modo,
      progresso: meta.progresso,
      etapas: meta.etapas ?? [],
    });

    setErro("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function salvarMeta(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro("");

    if (!formulario.titulo.trim()) {
      setErro("Informe o título da meta.");
      return;
    }

    if (
      formulario.modo === "TAREFAS" &&
      formulario.etapas.length === 0
    ) {
      setErro("Adicione pelo menos uma etapa para acompanhar por tarefas.");
      return;
    }

    setSalvando(true);

    const dados = {
      ...formulario,
      titulo: formulario.titulo.trim(),
      descricao: formulario.descricao.trim(),
      prazo: formulario.prazo || null,
      progresso: Number(formulario.progresso),
      concluida: false,
    };

    try {
      const resposta = await fetch(
        editandoId === null ? API : `${API}/${editandoId}`,
        {
          method: editandoId === null ? "POST" : "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dados),
        }
      );

      if (!resposta.ok) {
        const mensagem = await resposta.text();
        throw new Error(mensagem || "Não foi possível salvar a meta.");
      }

      const metaSalva: Meta = await resposta.json();

      setMetas((atuais) =>
        editandoId === null
          ? [...atuais, metaSalva]
          : atuais.map((meta) =>
              meta.id === metaSalva.id ? metaSalva : meta
            )
      );

      limparFormulario();
    } catch (e) {
      setErro(
        e instanceof Error ? e.message : "Erro ao salvar a meta."
      );
    } finally {
      setSalvando(false);
    }
  }

  async function excluirMeta(id: number) {
    if (!window.confirm("Deseja realmente excluir esta meta?")) return;

    setErro("");

    try {
      const resposta = await fetch(`${API}/${id}`, {
        method: "DELETE",
      });

      if (!resposta.ok) {
        throw new Error("Não foi possível excluir a meta.");
      }

      setMetas((atuais) => atuais.filter((meta) => meta.id !== id));

      if (editandoId === id) limparFormulario();
    } catch (e) {
      setErro(
        e instanceof Error ? e.message : "Erro ao excluir a meta."
      );
    }
  }

  async function atualizarProgressoManual(meta: Meta, progresso: number) {
    const novoProgresso = Math.max(0, Math.min(100, progresso));

    const dados = {
      ...meta,
      progresso: novoProgresso,
      concluida: novoProgresso === 100,
    };

    setErro("");

    try {
      const resposta = await fetch(`${API}/${meta.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados),
      });

      if (!resposta.ok) {
        throw new Error("Não foi possível atualizar o progresso.");
      }

      const atualizada: Meta = await resposta.json();

      setMetas((atuais) =>
        atuais.map((item) =>
          item.id === atualizada.id ? atualizada : item
        )
      );
    } catch (e) {
      setErro(
        e instanceof Error ? e.message : "Erro ao atualizar o progresso."
      );
    }
  }

  return (
    <main className="page-content">
      <div className="page-title">
        <p className="eyebrow">SEUS OBJETIVOS</p>
        <h1>Metas</h1>
        <p>Transforme seus planos em pequenas conquistas.</p>
      </div>

      {erro && (
        <p className="error-message" role="alert">
          {erro}
        </p>
      )}

      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>{editandoId === null ? "Nova meta" : "Editar meta"}</h2>
            <p>Defina seu objetivo e como acompanhar seu progresso.</p>
          </div>
        </div>

        <form className="task-form" onSubmit={salvarMeta}>
          <label>
            Título
            <input
              value={formulario.titulo}
              onChange={(e) => atualizarCampo("titulo", e.target.value)}
              placeholder="Ex.: Aprender programação"
              required
            />
          </label>

          <label>
            Descrição
            <textarea
              value={formulario.descricao}
              onChange={(e) => atualizarCampo("descricao", e.target.value)}
              placeholder="Descreva o que você quer alcançar"
              rows={3}
            />
          </label>

          <label>
            Prazo
            <input
              type="date"
              value={formulario.prazo}
              onChange={(e) => atualizarCampo("prazo", e.target.value)}
            />
          </label>

          <label>
            Acompanhamento
            <select
              value={formulario.modo}
              onChange={(e) =>
                atualizarCampo(
                  "modo",
                  e.target.value as "MANUAL" | "TAREFAS"
                )
              }
            >
              <option value="MANUAL">Progresso manual</option>
              <option value="TAREFAS">Por tarefas concluídas</option>
            </select>
          </label>

          {formulario.modo === "MANUAL" ? (
            <label>
              Progresso: {formulario.progresso}%
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={formulario.progresso}
                onChange={(e) =>
                  atualizarCampo("progresso", Number(e.target.value))
                }
              />
            </label>
          ) : (
            <div className="panel">
              <h3>Etapas da meta</h3>

              <div className="task-form">
                <label>
                  Nova etapa
                  <input
                    value={novaEtapa}
                    onChange={(e) => setNovaEtapa(e.target.value)}
                    placeholder="Ex.: Concluir o primeiro módulo"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        adicionarEtapa();
                      }
                    }}
                  />
                </label>

                <button
                  type="button"
                  className="secondary-button"
                  onClick={adicionarEtapa}
                >
                  Adicionar etapa
                </button>
              </div>

              {formulario.etapas.map((etapa, indice) => (
                <div className="task-item" key={`${indice}-${etapa.titulo}`}>
                  <label>
                    <input
                      type="checkbox"
                      checked={etapa.concluida}
                      onChange={() => alternarEtapa(indice)}
                    />
                    <span
                      style={{
                        textDecoration: etapa.concluida
                          ? "line-through"
                          : "none",
                      }}
                    >
                      {etapa.titulo}
                    </span>
                  </label>

                  <button
                    type="button"
                    className="delete-button"
                    onClick={() => removerEtapa(indice)}
                  >
                    Remover
                  </button>
                </div>
              ))}

              <p>
                Progresso calculado:{" "}
                {formulario.etapas.length === 0
                  ? 0
                  : Math.round(
                      (formulario.etapas.filter((etapa) => etapa.concluida)
                        .length /
                        formulario.etapas.length) *
                        100
                    )}
                %
              </p>
            </div>
          )}

          <div className="task-form">
            <button
              className="primary-button"
              type="submit"
              disabled={salvando}
            >
              {salvando
                ? "Salvando..."
                : editandoId === null
                  ? "Criar meta"
                  : "Salvar alterações"}
            </button>

            {editandoId !== null && (
              <button
                className="secondary-button"
                type="button"
                onClick={limparFormulario}
              >
                Cancelar edição
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Minhas metas</h2>
            <p>{metas.length} meta(s) cadastrada(s)</p>
          </div>
        </div>

        {carregando ? (
          <p className="empty-state">Carregando metas...</p>
        ) : metas.length === 0 ? (
          <div className="empty-state">
            <strong>Você ainda não tem metas.</strong>
            <p>Crie sua primeira meta e acompanhe cada conquista.</p>
          </div>
        ) : (
          <div className="task-list">
            {metas.map((meta) => (
              <article className="panel" key={meta.id}>
                <div className="panel-heading">
                  <div>
                    <h3>{meta.titulo}</h3>
                    {meta.descricao && <p>{meta.descricao}</p>}
                  </div>

                  <span>
                    {meta.concluida ? "Concluída" : "Em andamento"}
                  </span>
                </div>

                {meta.prazo && (
                  <p>
                    Prazo:{" "}
                    {new Date(`${meta.prazo}T12:00:00`).toLocaleDateString(
                      "pt-BR"
                    )}
                  </p>
                )}

                <div
                  style={{
                    background: "var(--border-color, #e5e7eb)",
                    borderRadius: 999,
                    height: 10,
                    overflow: "hidden",
                    margin: "12px 0",
                  }}
                >
                  <div
                    style={{
                      width: `${meta.progresso}%`,
                      height: "100%",
                      background: "#22c55e",
                      transition: "width 0.2s",
                    }}
                  />
                </div>

                <p>{meta.progresso}% concluído</p>

                {meta.modo === "TAREFAS" && (
                  <div>
                    {(meta.etapas ?? []).map((etapa, indice) => (
                      <p key={`${meta.id}-${indice}`}>
                        {etapa.concluida ? "☑" : "☐"} {etapa.titulo}
                      </p>
                    ))}
                  </div>
                )}

                {meta.modo === "MANUAL" && (
                  <label>
                    Atualizar progresso: {meta.progresso}%
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={meta.progresso}
                      onChange={(e) =>
                        void atualizarProgressoManual(
                          meta,
                          Number(e.target.value)
                        )
                      }
                    />
                  </label>
                )}

                <div className="task-form">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => editarMeta(meta)}
                  >
                    Editar
                  </button>

                  <button
                    type="button"
                    className="delete-button"
                    onClick={() => void excluirMeta(meta.id)}
                  >
                    Excluir
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
