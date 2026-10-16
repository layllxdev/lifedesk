
package com.lifedesk.seguranca;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.lifedesk.usuario.Usuario;
import com.lifedesk.usuario.UsuarioRepository;

@Configuration
public class AdminInicialConfig {

    @Bean
    public CommandLineRunner criarAdminInicial(
            UsuarioRepository repository,
            PasswordEncoder passwordEncoder,
            @Value("${LIFEDESK_ADMIN_NOME}") String nome,
            @Value("${LIFEDESK_ADMIN_EMAIL}") String email,
            @Value("${LIFEDESK_ADMIN_SENHA}") String senha) {

        return args -> {
            if (repository.count() == 0) {
                Usuario admin = new Usuario();
                admin.setNome(nome);
                admin.setEmail(email.trim().toLowerCase());
                admin.setSenha(passwordEncoder.encode(senha));
                admin.setAdministrador(true);
                admin.setAtivo(true);

                repository.save(admin);
            }
        };
    }
}
