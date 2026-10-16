import { useEffect, useState, type FormEvent } from "react";

import {

  BrowserRouter,

  NavLink,

  Route,

  Routes,

  useNavigate,

  useLocation,

} from "react-router-dom";

import "./App.css";

import Calendario from "./calendario/Calendario";

import Financas from "./financas/Financas";

import Metas from "./metas/Metas";

import Habitos from "./habitos/Habitos";

import Anotacoes from "./anotacoes/Anotacoes";


type Categoria = {

  id: number;

  nome: string;

};

const API_CATEGORIAS = "http://localhost:8080/api/categorias";
const API_COMPROMISSOS = "http://localhost:8080/api/compromissos";
const API_LANCAMENTOS = "http://localhost:8080/api/lancamentos";
const API_METAS = "http://localhost:8080/api/metas";

type Tarefa = {

  id: number;

  titulo: string;

  descricao: string | null;

  concluida: boolean;

};

const API = "http://localhost:8080/api/tarefas";

const paginas = [

  { caminho: "/", nome: "Início", icone: "⌂" },

  { caminho: "/tarefas", nome: "Tarefas", icone: "✓" },

  { caminho: "/calendario", nome: "Calendário", icone: "▦" },

  { caminho: "/financas", nome: "Finanças", icone: "$" },

  { caminho: "/metas", nome: "Metas", icone: "◎" },

  { caminho: "/habitos", nome: "Hábitos", icone: "↻" },

  { caminho: "/anotacoes", nome: "Anotações", icone: "▤" },

];

function Layout() {

  const localizacao = useLocation();
  const [quantidadeCompromissos, setQuantidadeCompromissos] = useState(0);
  const [saldoFinanceiro, setSaldoFinanceiro] = useState(0);
  const [metasEmAndamento, setMetasEmAndamento] = useState(0);
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);

  const [erro, setErro] = useState("");


const [nomeUsuario, setNomeUsuario] = useState(
  () => localStorage.getItem("lifedesk-nome") || "Ruann"
);

useEffect(() => {
  localStorage.setItem("lifedesk-nome", nomeUsuario);
}, [nomeUsuario]);

  const [tema, setTema] = useState<"claro" | "escuro">(() => {

  const temaSalvo = localStorage.getItem("lifedesk-tema");

  return temaSalvo === "escuro" ? "escuro" : "claro";

});

useEffect(() => {

  document.documentElement.dataset.theme =

    tema === "escuro" ? "dark" : "light";

  localStorage.setItem("lifedesk-tema", tema);

}, [tema]);

  async function carregarTarefas() {

    try {

      const resposta = await fetch(API);

      if (!resposta.ok) {

        throw new Error();

      }

      setTarefas(await resposta.json());

      setErro("");

    } catch {

      setErro(

        "Não foi possível conectar ao servidor. Confira se o backend está funcionando."

      );

    }

  }

  async function carregarResumo() {

    try {

      const resposta = await fetch(API_COMPROMISSOS);

      if (resposta.ok) {

        const dados = await resposta.json();

        setQuantidadeCompromissos(Array.isArray(dados) ? dados.length : 0);

      }

    } catch {

    }

    try {

      const resposta = await fetch(API_LANCAMENTOS);

      if (resposta.ok) {

        const dados: { valor: number | string; tipo: string }[] = await resposta.json();

        const saldo = (Array.isArray(dados) ? dados : []).reduce((total, item) => {

          const valor = Number(item.valor) || 0;

          const tipo = String(item.tipo || "").toLowerCase();

          if (tipo.includes("receita") || tipo.includes("entrada")) return total + valor;

          if (tipo.includes("despesa") || tipo.includes("saída") || tipo.includes("saida")) return total - valor;

          return total;

        }, 0);

        setSaldoFinanceiro(saldo);

      }

    } catch {

      // Mantém o último valor carregado se a API estiver indisponível.

    }

    try {
      const resposta = await fetch(API_METAS);
      if (resposta.ok) {
        const dados: { status?: string; situacao?: string; concluida?: boolean; concluidaEm?: string }[] = await resposta.json();
        const metasAtivas = (Array.isArray(dados) ? dados : []).filter((meta) => {
          const status = String(meta.status ?? meta.situacao ?? "").toLowerCase().replace(/[ _-]/g, "");
          if (meta.concluida === true || meta.concluidaEm) return false;
          return status.includes("andamento") || status === "ativa" || status === "ativo" || status === "emprogresso";
        });
        setMetasEmAndamento(metasAtivas.length);
      }
    } catch {
      // Mantém o último valor carregado se a API estiver indisponível.
    }

  }

  useEffect(() => {

    carregarTarefas();

    carregarResumo();

  }, [localizacao.pathname]);

  useEffect(() => {

    const atualizar = () => {

      if (document.visibilityState === "visible") {

        carregarTarefas();

        carregarResumo();

      }

    };

    const intervalo = window.setInterval(atualizar, 15000);

    window.addEventListener("focus", atualizar);

    document.addEventListener("visibilitychange", atualizar);

    return () => {

      window.clearInterval(intervalo);

      window.removeEventListener("focus", atualizar);

      document.removeEventListener("visibilitychange", atualizar);

    };

  }, []);

  const pendentes = tarefas.filter(

    (tarefa) => !tarefa.concluida

  ).length;

  return (

    <div className="app">

      <aside className="sidebar">

        <h1 className="logo">

          LifeDesk<span>.</span>

        </h1>

        <p className="sidebar-label">MENU PRINCIPAL</p>

        <nav>

          {paginas.map((pagina) => (

            <NavLink

              key={pagina.caminho}

              to={pagina.caminho}

              end={pagina.caminho === "/"}

              className={({ isActive }) =>

                `nav-item ${isActive ? "active" : ""}`

              }

            >

              <span className="nav-icon">{pagina.icone}</span>

              {pagina.nome}

              {pagina.caminho === "/tarefas" &&

                pendentes > 0 && (

                  <span className="nav-count">{pendentes}</span>

                )}

            </NavLink>

          ))}

        </nav>

        <div className="sidebar-bottom">

          <NavLink to="/configuracoes" className="nav-item">

            <span className="nav-icon">⚙</span>

            Configurações

          </NavLink>

          <div className="profile">

            <div className="avatar">R</div>

            <div>

              <strong>{nomeUsuario}</strong>

              <span>{nomeUsuario}</span>

            </div>

          </div>

        </div>

      </aside>

      <main className="main">

        <header className="topbar">

          <div>

            <p className="eyebrow">SEU ESPAÇO PESSOAL</p>

            <h2>LifeDesk</h2>

          </div>

      <div className="profile-button">

        <span className="avatar-small">

          {nomeUsuario.charAt(0).toUpperCase() || "U"}

        </span>

        <span>{nomeUsuario || "Usuário"}</span>

      </div>

        </header>

        {erro && (

          <p role="alert" className="error-message">

            {erro}

          </p>

        )}

        <Routes>

          <Route

            path="/"

            element={

              <Inicio

                tarefas={tarefas}

                pendentes={pendentes}

                nomeUsuario={nomeUsuario}

                quantidadeCompromissos={quantidadeCompromissos}

                saldoFinanceiro={saldoFinanceiro}
                metasEmAndamento={metasEmAndamento}

              />

            }

          />

          <Route

            path="/tarefas"

            element={

              <PaginaTarefas

                tarefas={tarefas}

                recarregar={carregarTarefas}

                definirErro={setErro}

              />

            }

          />

          <Route

            path="/calendario"

            element={<Calendario />}

          />

          <Route

            path="/financas"

            element={<Financas />}

          />

          <Route path="/metas" element={<Metas />} />

          <Route path="/habitos" element={<Habitos />} />

          <Route path="/anotacoes" element={<Anotacoes />} />

          <Route path="/configuracoes" element={ <Configuracoes tema={tema} alterarTema={setTema} nomeUsuario={nomeUsuario} alterarNomeUsuario={setNomeUsuario} /> } />

          <Route

            path="*"

            element={

              <PaginaInicial

                titulo="Página não encontrada"

                descricao="A página que você procura não existe."

                icone="?"

              />

            }

          />

        </Routes>

        <footer>

          <span>LifeDesk © 2026</span>

          <span>Sua vida, em ordem.</span>

        </footer>

      </main>

      <nav

        className="mobile-nav"

        aria-label="Navegação para celular"

      >

        {paginas.slice(0, 5).map((pagina) => (

          <NavLink

            key={pagina.caminho}

            to={pagina.caminho}

            end={pagina.caminho === "/"}

            className={({ isActive }) =>

              `mobile-nav-item ${isActive ? "active" : ""}`

            }

          >

            <span>{pagina.icone}</span>

            <small>{pagina.nome}</small>

          </NavLink>

        ))}

      </nav>

    </div>

  );

}

function Inicio({

  tarefas,

  pendentes,

  nomeUsuario,

  quantidadeCompromissos,

  saldoFinanceiro,

  metasEmAndamento,

}: {

  tarefas: Tarefa[];

  pendentes: number;

  nomeUsuario: string;

  quantidadeCompromissos: number;

  saldoFinanceiro: number;
  metasEmAndamento: number;

}) {

  const navegar = useNavigate();

  return (

    <>

      <section className="welcome">

        <div>

          <p>SEU DIA, MAIS ORGANIZADO</p>

          <h3>Olá, {nomeUsuario || "Usuário"}! 👋</h3>

          <span>

            Pequenos passos hoje. Grandes resultados amanhã.

          </span>

        </div>

        <div className="welcome-icon">✦</div>

      </section>

      <section className="section">

        <div className="section-heading">

          <div>

            <h3>Resumo geral</h3>

            <p>

              Acompanhe as principais informações do seu dia.

            </p>

          </div>

        </div>

        <div className="stats-grid">

          <CartaoResumo

            titulo="Tarefas pendentes"

            valor={pendentes}

            icone="✓"

          />

          <CartaoResumo

            titulo="Tarefas concluídas"

            valor={

              tarefas.filter((tarefa) => tarefa.concluida).length

            }

            icone="✔"

          />

          <CartaoResumo

            titulo="Compromissos"

            valor={quantidadeCompromissos}

            icone="▦"

          />

          <CartaoResumo

            titulo="Metas em andamento"

            valor={metasEmAndamento}

            icone="◎"

          />

          <CartaoResumo

            titulo="Saldo financeiro"

            valor={saldoFinanceiro.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}

            icone="$"

          />

        </div>

      </section>

      <section className="section panel">

        <div className="panel-heading">

          <div>

            <h3>Minhas tarefas</h3>

            <p>O que você precisa fazer?</p>

          </div>

          <button

            className="text-button"

            onClick={() => navegar("/tarefas")}

          >

            Ver todas →

          </button>

        </div>

        {tarefas.length === 0 ? (

          <div className="empty-state">

            <div className="empty-icon">✓</div>

            <strong>Nenhuma tarefa por enquanto</strong>

            <p>

              Crie sua primeira tarefa e comece a organizar seu dia.

            </p>

            <button

              className="primary-button"

              onClick={() => navegar("/tarefas")}

            >

              + Criar tarefa

            </button>

          </div>

        ) : (

          <div className="task-list">

            {tarefas.slice(0, 4).map((tarefa) => (

              <div className="task-item" key={tarefa.id}>

                <span

                  className={`task-status ${

                    tarefa.concluida ? "done" : ""

                  }`}

                >

                  {tarefa.concluida ? "✓" : "•"}

                </span>

                <div className="task-details">

                  <strong

                    className={

                      tarefa.concluida ? "completed" : ""

                    }

                  >

                    {tarefa.titulo}

                  </strong>

                  {tarefa.descricao && (

                    <p>{tarefa.descricao}</p>

                  )}

                </div>

              </div>

            ))}

            <button

              className="secondary-button"

              onClick={() => navegar("/tarefas")}

            >

              Gerenciar tarefas

            </button>

          </div>

        )}

      </section>

    </>

  );

}

function CartaoResumo({

  titulo,

  valor,

  icone,

}: {

  titulo: string;

  valor: string | number;

  icone: string;

}) {

  return (

    <article className="stat-card">

      <div className="stat-top">

        <span>{titulo}</span>

        <span className="stat-icon">{icone}</span>

      </div>

      <h3>{valor}</h3>

      <p>Resumo pessoal</p>

    </article>

  );

}

function PaginaTarefas({

  tarefas,

  recarregar,

  definirErro,

}: {

  tarefas: Tarefa[];

  recarregar: () => Promise<void>;

  definirErro: (mensagem: string) => void;

}) {

  const [titulo, setTitulo] = useState("");

  const [descricao, setDescricao] = useState("");

  const [salvando, setSalvando] = useState(false);

  async function cadastrar(

    evento: FormEvent<HTMLFormElement>

  ) {

    evento.preventDefault();

    if (!titulo.trim()) return;

    try {

      setSalvando(true);

      definirErro("");

      const resposta = await fetch(API, {

        method: "POST",

        headers: {

          "Content-Type": "application/json",

        },

        body: JSON.stringify({

          titulo: titulo.trim(),

          descricao: descricao.trim(),

        }),

      });

      if (!resposta.ok) {

        throw new Error();

      }

      setTitulo("");

      setDescricao("");

      await recarregar();

    } catch {

      definirErro(

        "Não foi possível salvar a tarefa. Tente novamente."

      );

    } finally {

      setSalvando(false);

    }

  }

  async function alternar(tarefa: Tarefa) {

    try {

      definirErro("");

      const resposta = await fetch(

        `${API}/${tarefa.id}/concluir`,

        { method: "PATCH" }

      );

      if (!resposta.ok) {

        throw new Error();

      }

      await recarregar();

    } catch {

      definirErro("Não foi possível atualizar a tarefa.");

    }

  }

  async function excluir(id: number) {

    if (!window.confirm("Deseja excluir esta tarefa?")) {

      return;

    }

    try {

      definirErro("");

      const resposta = await fetch(`${API}/${id}`, {

        method: "DELETE",

      });

      if (!resposta.ok) {

        throw new Error();

      }

      await recarregar();

    } catch {

      definirErro("Não foi possível excluir a tarefa.");

    }

  }

  return (

    <section className="page-content">

      <div className="page-title">

        <p className="eyebrow">ORGANIZE SUA ROTINA</p>

        <h2>Minhas tarefas</h2>

        <p>Cadastre, organize e conclua suas atividades.</p>

      </div>

      <div className="panel">

        <div className="panel-heading">

          <div>

            <h3>Nova tarefa</h3>

            <p>Registre o que você precisa fazer.</p>

          </div>

        </div>

        <form className="task-form" onSubmit={cadastrar}>

          <label htmlFor="titulo-tarefa">

            Título da tarefa

          </label>

          <input

            id="titulo-tarefa"

            value={titulo}

            onChange={(evento) => setTitulo(evento.target.value)}

            placeholder="Ex.: Estudar Java"

            required

          />

          <label htmlFor="descricao-tarefa">

            Descrição (opcional)

          </label>

          <textarea

            id="descricao-tarefa"

            value={descricao}

            onChange={(evento) =>

              setDescricao(evento.target.value)

            }

            placeholder="Adicione detalhes..."

            rows={3}

          />

          <button

            className="primary-button"

            type="submit"

            disabled={salvando}

          >

            {salvando ? "Salvando..." : "+ Adicionar tarefa"}

          </button>

        </form>

      </div>

      <div className="panel task-panel">

        <div className="panel-heading">

          <div>

            <h3>Todas as tarefas</h3>

            <p>

              {

                tarefas.filter((tarefa) => !tarefa.concluida)

                  .length

              }{" "}

              tarefas pendentes

            </p>

          </div>

        </div>

        {tarefas.length === 0 ? (

          <div className="empty-state">

            <div className="empty-icon">✓</div>

            <strong>Sua lista está vazia</strong>

            <p>

              Adicione sua primeira tarefa no formulário acima.

            </p>

          </div>

        ) : (

          <div className="task-list">

            {tarefas.map((tarefa) => (

              <div className="task-item" key={tarefa.id}>

                <input

                  type="checkbox"

                  checked={tarefa.concluida}

                  onChange={() => alternar(tarefa)}

                  aria-label={`Marcar ${tarefa.titulo} como concluída`}

                />

                <div className="task-details">

                  <strong

                    className={

                      tarefa.concluida ? "completed" : ""

                    }

                  >

                    {tarefa.titulo}

                  </strong>

                  {tarefa.descricao && (

                    <p>{tarefa.descricao}</p>

                  )}

                  <span>

                    {tarefa.concluida

                      ? "Concluída"

                      : "Pendente"}

                  </span>

                </div>

                <button

                  className="delete-button"

                  onClick={() => excluir(tarefa.id)}

                  aria-label={`Excluir ${tarefa.titulo}`}

                >

                  Excluir

                </button>

              </div>

            ))}

          </div>

        )}

      </div>

    </section>

  );

}

function PaginaInicial({

  titulo,

  descricao,

  icone,

}: {

  titulo: string;

  descricao: string;

  icone: string;

}) {

  return (

    <section className="page-content">

      <div className="page-title">

        <p className="eyebrow">SEU ESPAÇO PESSOAL</p>

        <h2>{titulo}</h2>

        <p>{descricao}</p>

      </div>

      <div className="panel placeholder-panel">

        <div className="empty-icon">{icone}</div>

        <h3>{titulo}</h3>

        <p>

          Esta área está pronta para a próxima etapa do desenvolvimento.

        </p>

      </div>

    </section>

  );

}

function Configuracoes({

  tema,

  alterarTema,

  nomeUsuario,

  alterarNomeUsuario,

}: {

  tema: "claro" | "escuro";

  alterarTema: (tema: "claro" | "escuro") => void;

  nomeUsuario: string;

  alterarNomeUsuario: (nome: string) => void;

}) {

  const [categorias, setCategorias] = useState<Categoria[]>([]);

  const [carregando, setCarregando] = useState(true);

  const [erroCategorias, setErroCategorias] = useState("");

  const [mensagem, setMensagem] = useState("");

  async function carregarCategorias() {

    try {

      setErroCategorias("");

      const resposta = await fetch(API_CATEGORIAS);

      if (!resposta.ok) {

        throw new Error("Não foi possível carregar as categorias.");

      }

      const dados: Categoria[] = await resposta.json();

      setCategorias(dados);

    } catch {

      setErroCategorias(

        "Não foi possível carregar as categorias. Confira se o backend está funcionando."

      );

    } finally {

      setCarregando(false);

    }

  }

  useEffect(() => {

    carregarCategorias();

  }, []);

  async function excluirCategoria(categoria: Categoria) {

    const confirmou = window.confirm(

      `Deseja excluir a categoria "${categoria.nome}"? Se ela estiver sendo usada em lançamentos, a exclusão será recusada.`

    );

    if (!confirmou) return;

    setMensagem("");

    setErroCategorias("");

    try {

      const resposta = await fetch(

        `${API_CATEGORIAS}/${categoria.id}`,

        { method: "DELETE" }

      );

      if (resposta.status === 409) {

        setMensagem(

          `A categoria "${categoria.nome}" está sendo usada em lançamentos financeiros e não pode ser excluída.`

        );

        return;

      }

      if (!resposta.ok) {

        throw new Error("Não foi possível excluir a categoria.");

      }

      setCategorias((atuais) =>

        atuais.filter((item) => item.id !== categoria.id)

      );

      setMensagem(`Categoria "${categoria.nome}" excluída.`);

    } catch {

      setErroCategorias(

        "Não foi possível excluir a categoria. Tente novamente."

      );

    }

  }

  return (

    <section className="page-content">

      <div className="page-title">

        <p className="eyebrow">PERSONALIZE SEU ESPAÇO</p>

        <h2>Configurações</h2>

        <p>Ajuste o LifeDesk para ficar do seu jeito.</p>

      </div>

      <div className="settings-list">

        <section className="settings-option">

          <div>

            <h3>Aparência</h3>

            <p>Escolha o tema do LifeDesk.</p>

            <div className="settings-theme-buttons">

              <button

                type="button"

                className={`settings-theme-button ${

                  tema === "claro" ? "active" : ""

                }`}

                aria-pressed={tema === "claro"}

                onClick={() => alterarTema("claro")}

              >

                ☀️ Tema claro

              </button>

              <button

                type="button"

                className={`settings-theme-button ${

                  tema === "escuro" ? "active" : ""

                }`}

                aria-pressed={tema === "escuro"}

                onClick={() => alterarTema("escuro")}

              >

                🌙 Tema escuro

              </button>

            </div>

            <p className="settings-status" role="status">

              Tema atual: {tema === "claro" ? "Claro" : "Escuro"}.

              Sua escolha fica salva neste navegador.

            </p>

          </div>

        </section>

        <section className="settings-option">

          <div>

            <h3>Meu perfil</h3>

            <p>Personalize como você aparece no LifeDesk.</p>

          <label htmlFor="nomeUsuario">Nome de exibição</label>

    <input

      id="nomeUsuario"

      type="text"

      value={nomeUsuario}

      onChange={(evento) => alterarNomeUsuario(evento.target.value)}

      placeholder="Digite seu nome"

      maxLength={60}

    />

    <p className="settings-status" role="status">

      Seu nome é salvo automaticamente neste navegador.

    </p>

  </div>

</section>

        <section className="settings-option">

          <div>

            <h3>Categorias financeiras</h3>

            <p>

              Gerencie as categorias personalizadas usadas nas Finanças.

            </p>

            {carregando && <p>Carregando categorias...</p>}

            {erroCategorias && (

              <p role="alert">{erroCategorias}</p>

            )}

            {mensagem && <p role="status">{mensagem}</p>}

            {!carregando && categorias.length === 0 && (

              <p>Nenhuma categoria cadastrada.</p>

            )}

            <div className="settings-category-list">

              {categorias.map((categoria) => (

                <div

                  className="settings-category-item"

                  key={categoria.id}

                >

                  <span>{categoria.nome}</span>

                  <button

                    type="button"

                    className="delete-button"

                    onClick={() => excluirCategoria(categoria)}

                    aria-label={`Excluir categoria ${categoria.nome}`}

                  >

                    Excluir

                  </button>

                </div>

              ))}

            </div>

          </div>

        </section>

      </div>

    </section>

  );

}

export default function App() {

  return (

    <BrowserRouter>

      <Layout />

    </BrowserRouter>

  );

}
