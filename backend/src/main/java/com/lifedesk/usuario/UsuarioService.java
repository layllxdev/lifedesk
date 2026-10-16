
package com.lifedesk.usuario;

import java.util.Locale;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    public UsuarioService(
            UsuarioRepository usuarioRepository,
            PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public Usuario criarUsuario(String nome, String email, String senha) {
        String emailNormalizado = email.trim().toLowerCase(Locale.ROOT);

        if (usuarioRepository.existsByEmail(emailNormalizado)) {
            throw new IllegalArgumentException(
                "Este e-mail já está cadastrado."
            );
        }

        Usuario usuario = new Usuario();
        usuario.setNome(nome.trim());
        usuario.setEmail(emailNormalizado);
        usuario.setSenha(passwordEncoder.encode(senha));
        usuario.setAdministrador(false);
        usuario.setAtivo(false);

        return usuarioRepository.save(usuario);
    }

    public Usuario autenticar(String email, String senha) {
        Usuario usuario = usuarioRepository.findByEmail(
            email.trim().toLowerCase(Locale.ROOT)
        ).orElseThrow(() ->
            new IllegalArgumentException("E-mail ou senha inválidos.")
        );

        if (!usuario.isAtivo()
                || !passwordEncoder.matches(senha, usuario.getSenha())) {
            throw new IllegalArgumentException(
                "E-mail ou senha inválidos."
            );
        }

        return usuario;
    }

    public Usuario aprovarUsuario(Long id) {
        Usuario usuario = usuarioRepository.findById(id)
            .orElseThrow(() ->
                new IllegalArgumentException("Usuário não encontrado.")
            );

        usuario.setAtivo(true);
        return usuarioRepository.save(usuario);
    }
}
