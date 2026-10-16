import { useEffect, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Underline from "@tiptap/extension-underline";
import "./Anotacoes.css";

const API = "http://localhost:8080/api/anotacoes";

type Pasta = {
  id: number;
  nome: string;
  pastaPaiId: number | null;
};

type Anotacao = {
  id: number;
  titulo: string;
  conteudo: string;
  pastaId: number | null;
  dataAtualizacao: string;
  dataCriacao: string;
};

export default function Anotacoes() {
  const [pastas, setPastas] = useState<Pasta[]>([]);
  const [anotacoes, setAnotacoes] = useState<Anotacao[]>([]);
  const [pastaAtual, setPastaAtual] = useState<number | null>(null);
  const [titulo, setTitulo] = useState("");
  const [anotacaoId, setAnotacaoId] = useState<number | null>(null);
  const [busca, setBusca] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Image.configure({
        inline: false,
        allowBase64: true,
      }),
    ],
    content: "",
    editorProps: {
      attributes: {
        class: "anotacoes-editor",
        spellcheck: "true",
      },
    },
  });

  async function carregarPastas() {
    try {
      const resposta = await fetch(`${API}/pastas`);
      if (!resposta.ok) throw new Error();
      setPastas(await resposta.json());
    } catch {
      setErro("Não foi possível carregar as pastas. Verifique o backend.");
    }
  }

  async function carregarAnotacoes() {
    try {
      const parametro = busca.trim()
        ? `?busca=${encodeURIComponent(busca.trim())}`
        : pastaAtual === null
          ? ""
          : `?pastaId=${pastaAtual}`;

      const resposta = await fetch(`${API}${parametro}`);
      if (!resposta.ok) throw new Error();

      setAnotacoes(await resposta.json());
      setErro("");
    } catch {
      setErro("Não foi possível carregar as anotações.");
    }
  }

  useEffect(() => {
    void carregarPastas();
  }, []);

  useEffect(() => {
    void carregarAnotacoes();
  }, [pastaAtual, busca]);

  function novaAnotacao() {
    setAnotacaoId(null);
    setTitulo("");
    editor?.commands.setContent("");
    setErro("");
  }

  async function abrirAnotacao(anotacao: Anotacao) {
    try {
      const resposta = await fetch(`${API}/${anotacao.id}`);
      if (!resposta.ok) throw new Error();

      const completa: Anotacao = await resposta.json();

      setAnotacaoId(completa.id);
      setTitulo(completa.titulo);
      editor?.commands.setContent(completa.conteudo || "");
      setErro("");
    } catch {
      setErro("Não foi possível abrir essa anotação.");
    }
  }

  async function salvarAnotacao() {
    if (!titulo.trim()) {
      setErro("Digite um título para a anotação.");
      return;
    }

    if (!editor) return;

    setCarregando(true);
    setErro("");

    try {
      const dados = {
        titulo: titulo.trim(),
        conteudo: editor.getHTML(),
        pastaId: pastaAtual,
      };

      const url = anotacaoId
        ? `${API}/${anotacaoId}`
        : API;

      const resposta = await fetch(url, {
        method: anotacaoId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados),
      });

      if (!resposta.ok) {
        const mensagem = await resposta.text();
        throw new Error(mensagem || "Erro ao salvar.");
      }

      const salva: Anotacao = await resposta.json();

      setAnotacaoId(salva.id);
      await carregarAnotacoes();
    } catch (e) {
      setErro(
        e instanceof Error
          ? `Erro ao salvar: ${e.message}`
          : "Erro ao salvar a anotação."
      );
    } finally {
      setCarregando(false);
    }
  }

  async function criarPasta() {
    const nome = prompt("Qual será o nome da pasta?");
    if (!nome?.trim()) return;

    try {
      const resposta = await fetch(`${API}/pastas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: nome.trim(),
          pastaPaiId: pastaAtual,
        }),
      });

      if (!resposta.ok) throw new Error();

      const criada: Pasta = await resposta.json();
      await carregarPastas();
      setPastaAtual(criada.id);
      novaAnotacao();
    } catch {
      setErro("Não foi possível criar a pasta.");
    }
  }

  async function renomearPasta(pasta: Pasta) {
    const nome = prompt("Novo nome da pasta:", pasta.nome);
    if (!nome?.trim()) return;

    try {
      const resposta = await fetch(`${API}/pastas/${pasta.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: nome.trim(),
          pastaPaiId: pasta.pastaPaiId,
        }),
      });

      if (!resposta.ok) throw new Error();
      await carregarPastas();
    } catch {
      setErro("Não foi possível renomear a pasta.");
    }
  }

  async function excluirPasta(pasta: Pasta) {
    if (
      !confirm(
        `Excluir "${pasta.nome}" e todas as suas subpastas e anotações?`
      )
    ) {
      return;
    }

    try {
      const resposta = await fetch(`${API}/pastas/${pasta.id}`, {
        method: "DELETE",
      });

      if (!resposta.ok) throw new Error();

      if (pastaAtual === pasta.id) setPastaAtual(null);

      await carregarPastas();
      await carregarAnotacoes();
      novaAnotacao();
    } catch {
      setErro("Não foi possível excluir a pasta.");
    }
  }

  async function excluirAnotacao() {
    if (anotacaoId === null) return;
    if (!confirm("Deseja excluir esta anotação?")) return;

    try {
      const resposta = await fetch(`${API}/${anotacaoId}`, {
        method: "DELETE",
      });

      if (!resposta.ok) throw new Error();

      novaAnotacao();
      await carregarAnotacoes();
    } catch {
      setErro("Não foi possível excluir a anotação.");
    }
  }

  async function importarImagem(
    evento: React.ChangeEvent<HTMLInputElement>
  ) {
    const arquivo = evento.target.files?.[0];
    if (!arquivo || !editor) return;

    if (!arquivo.type.startsWith("image/")) {
      setErro("Selecione um arquivo de imagem.");
      return;
    }

    if (arquivo.size > 2 * 1024 * 1024) {
      setErro("A imagem deve ter no máximo 2 MB.");
      return;
    }

    const leitor = new FileReader();

    leitor.onload = () => {
      const resultado = leitor.result;
      if (typeof resultado === "string") {
        editor.chain().focus().setImage({ src: resultado }).run();
      }
    };

    leitor.readAsDataURL(arquivo);
    evento.target.value = "";
  }

  function adicionarDesenho() {
    if (!editor) return;

    const canvas = document.createElement("canvas");
    canvas.width = 900;
    canvas.height = 420;

    const contexto = canvas.getContext("2d");
    if (!contexto) return;

    contexto.fillStyle = "#ffffff";
    contexto.fillRect(0, 0, canvas.width, canvas.height);

    let desenhando = false;
    let cor = "#222222";
    let largura = 4;

    const quadro = window.open("", "_blank");
    if (!quadro) {
      setErro("Permita a abertura da janela de desenho no navegador.");
      return;
    }

    quadro.document.title = "Desenhar";

    const barra = quadro.document.createElement("div");
    barra.style.cssText =
      "display:flex;gap:10px;padding:12px;align-items:center;flex-wrap:wrap";

    const seletorCor = quadro.document.createElement("input");
    seletorCor.type = "color";
    seletorCor.value = cor;
    seletorCor.title = "Cor da caneta";
    seletorCor.oninput = () => { cor = seletorCor.value; };

    const seletorLargura = quadro.document.createElement("input");
    seletorLargura.type = "range";
    seletorLargura.min = "1";
    seletorLargura.max = "20";
    seletorLargura.value = "4";
    seletorLargura.title = "Espessura da caneta";
    seletorLargura.oninput = () => {
      largura = Number(seletorLargura.value);
    };

    const borracha = quadro.document.createElement("button");
    borracha.textContent = "Borracha";
    borracha.onclick = () => { cor = "#ffffff"; };

    const limpar = quadro.document.createElement("button");
    limpar.textContent = "Limpar";
    limpar.onclick = () => {
      contexto.fillStyle = "#ffffff";
      contexto.fillRect(0, 0, canvas.width, canvas.height);
    };

    const inserir = quadro.document.createElement("button");
    inserir.textContent = "Inserir desenho";
    inserir.onclick = () => {
      editor.chain().focus().setImage({
        src: canvas.toDataURL("image/png"),
      }).run();
      quadro.close();
    };

    barra.append(seletorCor, seletorLargura, borracha, limpar, inserir);

    canvas.style.cssText =
      "width:100%;height:auto;touch-action:none;border:1px solid #ccc;cursor:crosshair";

    function posicao(evento: PointerEvent) {
      const retangulo = canvas.getBoundingClientRect();

      return {
        x: (evento.clientX - retangulo.left) * (canvas.width / retangulo.width),
        y: (evento.clientY - retangulo.top) * (canvas.height / retangulo.height),
      };
    }

    canvas.onpointerdown = (evento) => {
      desenhando = true;
      const p = posicao(evento);
      contexto.beginPath();
      contexto.moveTo(p.x, p.y);
      canvas.setPointerCapture(evento.pointerId);
    };

    canvas.onpointermove = (evento) => {
      if (!desenhando) return;

      const p = posicao(evento);
      contexto.strokeStyle = cor;
      contexto.lineWidth = largura;
      contexto.lineCap = "round";
      contexto.lineJoin = "round";
      contexto.lineTo(p.x, p.y);
      contexto.stroke();
    };

    canvas.onpointerup = () => { desenhando = false; };
    canvas.onpointercancel = () => { desenhando = false; };

    quadro.document.body.style.cssText =
      "margin:0;padding:16px;font-family:Arial,sans-serif";

    quadro.document.body.append(barra, canvas);
  }

  const pastasVisiveis = pastas.filter((pasta) =>
  pastaAtual === null
    ? pasta.pastaPaiId === null
    : pasta.pastaPaiId === pastaAtual
);

  const pastaPaiAtual = pastas.find((p) => p.id === pastaAtual);

  return (
    <main className="page-content anotacoes-pagina">
      <header className="page-title">
        <span className="eyebrow">ORGANIZE SUAS IDEIAS</span>
        <h1>Anotações</h1>
        <p>Seu caderno digital, do seu jeito.</p>
      </header>

      {erro && (
        <div className="error-message" role="alert">
          {erro}
          <button onClick={() => setErro("")}>Fechar</button>
        </div>
      )}

      <div className="anotacoes-layout">
        <aside className="panel anotacoes-sidebar">
          <div className="anotacoes-sidebar-titulo">
            <h2>Minhas pastas</h2>
            <button onClick={criarPasta} title="Criar pasta">
              + Pasta
            </button>
          </div>

          <button
            className={`anotacoes-pasta ${pastaAtual === null ? "selecionada" : ""}`}
            onClick={() => setPastaAtual(null)}
          >
            <span>🏠</span> Início
          </button>

          {pastaPaiAtual && (
            <button
              className="anotacoes-pasta"
              onClick={() => setPastaAtual(pastaPaiAtual.pastaPaiId)}
            >
              <span>↩</span> Voltar
            </button>
          )}

          {pastasVisiveis.map((pasta) => (
            <div className="anotacoes-pasta-linha" key={pasta.id}>
              <button
                className={`anotacoes-pasta ${pastaAtual === pasta.id ? "selecionada" : ""}`}
                onClick={() => setPastaAtual(pasta.id)}
              >
                <span>📁</span>
                <span className="anotacoes-pasta-nome">{pasta.nome}</span>
              </button>

              <button
                className="anotacoes-menu"
                title="Renomear pasta"
                onClick={() => renomearPasta(pasta)}
              >
                ✎
              </button>

              <button
                className="anotacoes-menu"
                title="Excluir pasta"
                onClick={() => excluirPasta(pasta)}
              >
                ×
              </button>
            </div>
          ))}

          <p className="anotacoes-ajuda">
            Entre em uma pasta para criar subpastas.
          </p>
        </aside>

        <section className="panel anotacoes-conteudo">
          <div className="anotacoes-topo">
            <div>
              <h2>{pastaPaiAtual?.nome ?? "Minhas anotações"}</h2>
              <p>
                {anotacoes.length}{" "}
                {anotacoes.length === 1 ? "anotação" : "anotações"}
              </p>
            </div>

            <button className="primary-button" onClick={novaAnotacao}>
              + Nova anotação
            </button>
          </div>

          <input
            className="anotacoes-busca"
            type="search"
            placeholder="Pesquisar anotações..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />

          <div className="anotacoes-lista">
            {anotacoes.map((anotacao) => (
              <button
                className={`anotacao-card ${anotacaoId === anotacao.id ? "selecionada" : ""}`}
                key={anotacao.id}
                onClick={() => void abrirAnotacao(anotacao)}
              >
                <strong>{anotacao.titulo}</strong>
                <small>
                  Atualizada:{" "}
                  {new Date(anotacao.dataAtualizacao).toLocaleDateString("pt-BR")}
                </small>
              </button>
            ))}

            {anotacoes.length === 0 && (
              <div className="empty-state">
                Nenhuma anotação aqui ainda.
              </div>
            )}
          </div>

          <div className="anotacoes-editor-area">
            <label htmlFor="titulo-anotacao">Título da anotação</label>
            <input
              id="titulo-anotacao"
              className="anotacoes-titulo-input"
              placeholder="Ex.: Resumo de Banco de Dados"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
            />

            <div className="anotacoes-toolbar">
              <button
                onClick={() => editor?.chain().focus().toggleBold().run()}
                disabled={!editor}
                title="Negrito"
              >
                <strong>B</strong>
              </button>

              <button
                onClick={() => editor?.chain().focus().toggleItalic().run()}
                disabled={!editor}
                title="Itálico"
              >
                <em>I</em>
              </button>

              <button
                onClick={() => editor?.chain().focus().toggleUnderline().run()}
                disabled={!editor}
                title="Sublinhado"
              >
                <u>U</u>
              </button>

              <button
                onClick={() =>
                  editor?.chain().focus().toggleHeading({ level: 1 }).run()
                }
                disabled={!editor}
                title="Título"
              >
                H1
              </button>

              <button
                onClick={() =>
                  editor?.chain().focus().toggleBulletList().run()
                }
                disabled={!editor}
                title="Lista"
              >
                • Lista
              </button>

              <label className="anotacoes-imagem-botao">
                🖼 Foto
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={importarImagem}
                />
              </label>

              <button onClick={adicionarDesenho}>
                ✎ Desenhar
              </button>
            </div>

            <EditorContent editor={editor} />

            <div className="anotacoes-salvar">
              {anotacaoId !== null && (
                <button
                  className="delete-button"
                  onClick={() => void excluirAnotacao()}
                >
                  Excluir
                </button>
              )}

              <button
                className="primary-button"
                onClick={() => void salvarAnotacao()}
                disabled={carregando}
              >
                {carregando ? "Salvando..." : "Salvar anotação"}
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}