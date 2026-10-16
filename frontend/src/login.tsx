import { useState, type FormEvent } from "react";
import "./Login.css";

type Props = {
  aoEntrar: (usuario: {
    id: number;
    nome: string;
    email: string;
    administrador: boolean;
  }) => void;
};

export default function Login({ aoEntrar }: Props) {
  const [cadastro, setCadastro] = useState(false);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    setMensagem("");
    setCarregando(true);

    try {
      const resposta = await fetch(
        `http://localhost:8080/api/auth/${cadastro ? "cadastro" : "login"}`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            cadastro ? { nome, email, senha } : { email, senha }
          ),
        }
      );

      const dados = await resposta.json().catch(() => null);

      if (!resposta.ok) {
        throw new Error(
          dados?.detail || dados?.message || "Não foi possível realizar a operação."
        );
      }

      if (cadastro) {
        setMensagem(
          "Cadastro realizado! Aguarde a liberação da administradora."
        );
        setCadastro(false);
        setSenha("");
      } else {
        aoEntrar(dados);
      }
    } catch (erro) {
      setMensagem(
        erro instanceof Error
          ? erro.message
          : "Não foi possível conectar ao servidor."
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="login-page">
      <form className="login-card" onSubmit={enviar}>
        <h1>LifeDesk<span>.</span></h1>
        <p>Seu espaço pessoal, em ordem.</p>

        <h2>{cadastro ? "Criar conta" : "Bem-vindo de volta"}</h2>

        {cadastro && (
          <label>
            Nome
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
            />
          </label>
        )}

        <label>
          E-mail
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        <label>
          Senha
          <input
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            minLength={8}
            required
          />
        </label>

        <button disabled={carregando}>
          {carregando
            ? "Aguarde..."
            : cadastro
              ? "Cadastrar"
              : "Entrar"}
        </button>

        {mensagem && <p role="status">{mensagem}</p>}

        <button
          type="button"
          className="login-alternar"
          onClick={() => {
            setCadastro(!cadastro);
            setMensagem("");
          }}
        >
          {cadastro
            ? "Já tenho uma conta"
            : "Criar uma conta"}
        </button>
      </form>
    </main>
  );
}