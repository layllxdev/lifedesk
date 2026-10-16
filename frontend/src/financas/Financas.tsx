
import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

type TipoLancamento = "receita" | "despesa";

type Lancamento = {
  id: number;
  descricao: string;
  valor: number;
  tipo: TipoLancamento;
  categoria: string;
  data: string;
};

type Categoria = {
  id: number;
  nome: string;
};

const API_LANCAMENTOS = "http://localhost:8080/api/lancamentos";
const API_CATEGORIAS = "http://localhost:8080/api/categorias";

function formatarMoeda(valor: number) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function normalizarLancamento(item: any): Lancamento {
  return {
    id: item.id,
    descricao: item.descricao,
    valor: Number(item.valor),
    tipo: String(item.tipo).toLowerCase() as TipoLancamento,
    categoria: item.categoria,
    data: String(item.data).slice(0, 10),
  };
}

export default function Financas() {
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [tipo, setTipo] = useState<TipoLancamento>("receita");
  const [categoria, setCategoria] = useState("Outros");
  const [data, setData] = useState(
    new Date().toLocaleDateString("en-CA")
  );
  const [filtroCategoria, setFiltroCategoria] = useState("Todas");
  const [outraCategoria, setOutraCategoria] = useState(false);
  const [nomeOutraCategoria, setNomeOutraCategoria] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [salvandoCategoria, setSalvandoCategoria] = useState(false);

  useEffect(() => {
    async function carregarDados() {
      setCarregando(true);
      setErro("");

      try {
        const [respostaLancamentos, respostaCategorias] =
          await Promise.all([
            fetch(API_LANCAMENTOS),
            fetch(API_CATEGORIAS),
          ]);

        if (!respostaLancamentos.ok) {
          throw new Error("Não foi possível carregar os lançamentos.");
        }

        if (!respostaCategorias.ok) {
          throw new Error("Não foi possível carregar as categorias.");
        }

        const dadosLancamentos = await respostaLancamentos.json();
        const dadosCategorias = await respostaCategorias.json();

        setLancamentos(dadosLancamentos.map(normalizarLancamento));
        setCategorias(dadosCategorias);

        if (dadosCategorias.length > 0) {
          setCategoria((atual) =>
            dadosCategorias.some((c: Categoria) => c.nome === atual)
              ? atual
              : dadosCategorias.find((c: Categoria) => c.nome === "Outros")
                  ?.nome ?? dadosCategorias[0].nome
          );
        }
      } catch (e) {
        setErro(
          e instanceof Error
            ? e.message
            : "Erro ao conectar com o servidor."
        );
      } finally {
        setCarregando(false);
      }
    }

    carregarDados();
  }, []);

  const receitas = useMemo(
    () =>
      lancamentos
        .filter((item) => item.tipo === "receita")
        .reduce((total, item) => total + item.valor, 0),
    [lancamentos]
  );

  const despesas = useMemo(
    () =>
      lancamentos
        .filter((item) => item.tipo === "despesa")
        .reduce((total, item) => total + item.valor, 0),
    [lancamentos]
  );

  const saldo = receitas - despesas;

  const lancamentosFiltrados = useMemo(
    () =>
      lancamentos
        .filter(
          (item) =>
            filtroCategoria === "Todas" ||
            item.categoria === filtroCategoria
        )
        .sort((a, b) => b.data.localeCompare(a.data)),
    [lancamentos, filtroCategoria]
  );

  const dadosGrafico = [
    { nome: "Financeiro", Receitas: receitas, Despesas: despesas },
  ];

  async function adicionarLancamento(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro("");

    const valorNumerico = Number(valor.replace(",", "."));

    if (!descricao.trim()) {
      setErro("Informe a descrição do lançamento.");
      return;
    }

    if (!valor.trim() || !Number.isFinite(valorNumerico) || valorNumerico <= 0) {
      setErro("Informe um valor válido maior que zero.");
      return;
    }

    if (!categoria || categoria === "__outra__") {
      setErro("Selecione uma categoria.");
      return;
    }

    if (!data) {
      setErro("Informe a data do lançamento.");
      return;
    }

    setSalvando(true);

    try {
      const resposta = await fetch(API_LANCAMENTOS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          descricao: descricao.trim(),
          valor: valorNumerico,
          tipo: tipo,
          categoria,
          data,
        }),
      });

      if (!resposta.ok) {
        const mensagem = await resposta.text();
        throw new Error(mensagem || "Não foi possível salvar o lançamento.");
      }

      const novoLancamento = normalizarLancamento(await resposta.json());

      setLancamentos((atuais) => [novoLancamento, ...atuais]);
      setDescricao("");
      setValor("");
      setErro("");
    } catch (e) {
      setErro(
        e instanceof Error
          ? e.message
          : "Erro ao salvar o lançamento."
      );
    } finally {
      setSalvando(false);
    }
  }

  async function adicionarCategoria() {
    setErro("");

    const nome = nomeOutraCategoria.trim();

    if (!nome) {
      setErro("Digite o nome da nova categoria.");
      return;
    }

    const existente = categorias.find(
      (item) => item.nome.toLocaleLowerCase() === nome.toLocaleLowerCase()
    );

    if (existente) {
      setCategoria(existente.nome);
      setNomeOutraCategoria("");
      setOutraCategoria(false);
      setErro("Essa categoria já existe e foi selecionada.");
      return;
    }

    setSalvandoCategoria(true);

    try {
      const resposta = await fetch(API_CATEGORIAS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome }),
      });

      if (!resposta.ok) {
        const mensagem = await resposta.text();
        throw new Error(
          mensagem || "Não foi possível cadastrar a categoria."
        );
      }

      const criada: Categoria = await resposta.json();

      setCategorias((atuais) => {
        if (atuais.some((item) => item.id === criada.id)) {
          return atuais;
        }
        return [...atuais, criada].sort((a, b) =>
          a.nome.localeCompare(b.nome, "pt-BR")
        );
      });

      setCategoria(criada.nome);
      setFiltroCategoria("Todas");
      setNomeOutraCategoria("");
      setOutraCategoria(false);
      setErro("");
    } catch (e) {
      setErro(
        e instanceof Error
          ? e.message
          : "Erro ao cadastrar a categoria."
      );
    } finally {
      setSalvandoCategoria(false);
    }
  }

  async function excluirLancamento(id: number) {
    const confirmar = window.confirm(
      "Tem certeza de que deseja excluir este lançamento?"
    );

    if (!confirmar) return;

    setErro("");

    try {
      const resposta = await fetch(`${API_LANCAMENTOS}/${id}`, {
        method: "DELETE",
      });

      if (!resposta.ok) {
        throw new Error("Não foi possível excluir o lançamento.");
      }

      setLancamentos((atuais) =>
        atuais.filter((item) => item.id !== id)
      );
    } catch (e) {
      setErro(
        e instanceof Error ? e.message : "Erro ao excluir o lançamento."
      );
    }
  }

  return (
    <main className="page-content">
      <div className="page-title">
        <p className="eyebrow">ORGANIZE SEU DINHEIRO</p>
        <h1>Finanças</h1>
        <p>Acompanhe suas receitas, despesas e seu saldo.</p>
      </div>

      {erro && (
        <div className="error-message" role="alert">
          {erro}
        </div>
      )}

      <section className="stats-grid">
        <article className="stat-card">
          <div className="stat-top">
            <span>Receitas</span>
            <span className="stat-icon">↗</span>
          </div>
          <h2>{formatarMoeda(receitas)}</h2>
        </article>

        <article className="stat-card">
          <div className="stat-top">
            <span>Despesas</span>
            <span className="stat-icon">↘</span>
          </div>
          <h2>{formatarMoeda(despesas)}</h2>
        </article>

        <article className="stat-card">
          <div className="stat-top">
            <span>Saldo</span>
            <span className="stat-icon">R$</span>
          </div>
          <h2>{formatarMoeda(saldo)}</h2>
        </article>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <h2>Novo lançamento</h2>
        </div>

        <form className="task-form" onSubmit={adicionarLancamento}>
          <label>
            Descrição
            <input
              type="text"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ex.: Bolsa, mercado, transporte"
              required
            />
          </label>

          <label>
            Valor (R$)
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder="0,00"
              required
            />
          </label>

          <label>
            Tipo
            <select
              value={tipo}
              onChange={(e) =>
                setTipo(e.target.value as TipoLancamento)
              }
            >
              <option value="receita">Receita</option>
              <option value="despesa">Despesa</option>
            </select>
          </label>

          <label>
            Categoria
            <select
              value={outraCategoria ? "__outra__" : categoria}
              onChange={(e) => {
                if (e.target.value === "__outra__") {
                  setOutraCategoria(true);
                  setNomeOutraCategoria("");
                } else {
                  setOutraCategoria(false);
                  setCategoria(e.target.value);
                }
              }}
            >
              {categorias.map((item) => (
                <option key={item.id} value={item.nome}>
                  {item.nome}
                </option>
              ))}
              {!categorias.some((item) => item.nome === "Outros") && (
                <option value="Outros">Outros</option>
              )}
              <option value="__outra__">+ Outra categoria...</option>
            </select>
          </label>

          {outraCategoria && (
            <div className="task-form">
              <label>
                Nome da nova categoria
                <input
                  type="text"
                  value={nomeOutraCategoria}
                  onChange={(e) => setNomeOutraCategoria(e.target.value)}
                  placeholder="Ex.: Pets"
                  autoFocus
                />
              </label>

              <button
                type="button"
                className="secondary-button"
                onClick={adicionarCategoria}
                disabled={salvandoCategoria}
              >
                {salvandoCategoria ? "Salvando..." : "Salvar categoria"}
              </button>

              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  setOutraCategoria(false);
                  setNomeOutraCategoria("");
                  setErro("");
                }}
              >
                Cancelar
              </button>
            </div>
          )}

          <label>
            Data
            <input
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
              required
            />
          </label>

          <button
            type="submit"
            className="primary-button"
            disabled={salvando || outraCategoria}
          >
            {salvando ? "Salvando..." : "Adicionar lançamento"}
          </button>
        </form>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <h2>Visão financeira</h2>
        </div>

        <div style={{ width: "100%", height: 280 }}>
          <ResponsiveContainer>
            <BarChart data={dadosGrafico}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="nome" />
              <YAxis />
              <Tooltip
                formatter={(valorGrafico) =>
                  formatarMoeda(Number(valorGrafico))
                }
              />
              <Legend />
              <Bar dataKey="Receitas" fill="#22C55E" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Despesas" fill="#EF4444" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <h2>Lançamentos</h2>

          <label>
            Filtrar por categoria
            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
            >
              <option value="Todas">Todas as categorias</option>
              {categorias.map((item) => (
                <option key={item.id} value={item.nome}>
                  {item.nome}
                </option>
              ))}
            </select>
          </label>
        </div>

        {carregando ? (
          <p className="empty-state">Carregando lançamentos...</p>
        ) : lancamentosFiltrados.length === 0 ? (
          <p className="empty-state">
            Nenhum lançamento encontrado para essa categoria.
          </p>
        ) : (
          <div className="task-list">
            {lancamentosFiltrados.map((item) => (
              <article className="task-item" key={item.id}>
                <div className="task-details">
                  <strong>{item.descricao}</strong>
                  <span>
                    {item.categoria} ·{" "}
                    {new Date(`${item.data}T12:00:00`).toLocaleDateString(
                      "pt-BR"
                    )}
                  </span>
                </div>

                <div>
                  <strong>
                    {item.tipo === "receita" ? "+" : "−"}
                    {formatarMoeda(item.valor)}
                  </strong>
                  <button
                    type="button"
                    className="delete-button"
                    onClick={() => excluirLancamento(item.id)}
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
