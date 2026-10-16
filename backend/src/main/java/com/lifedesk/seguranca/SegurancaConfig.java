
package com.lifedesk.seguranca;

import java.util.Locale;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.lifedesk.usuario.Usuario;
import com.lifedesk.usuario.UsuarioRepository;

@Configuration
@EnableMethodSecurity
public class SegurancaConfig {

    @Bean
    public UserDetailsService userDetailsService(
            UsuarioRepository usuarioRepository) {
        return email -> {
            Usuario usuario = usuarioRepository.findByEmail(
                email.trim().toLowerCase(Locale.ROOT)
            ).orElseThrow(() ->
                new UsernameNotFoundException("Usuário não encontrado.")
            );

            if (!usuario.isAtivo()) {
                throw new UsernameNotFoundException("Conta inativa.");
            }

            return User.withUsername(usuario.getEmail())
                .password(usuario.getSenha())
                .roles(usuario.isAdministrador() ? "ADMIN" : "USER")
                .build();
        };
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider(
            UserDetailsService userDetailsService,
            PasswordEncoder passwordEncoder) {
        DaoAuthenticationProvider provider =
            new DaoAuthenticationProvider(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder);
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }

    @Bean
    public SecurityContextRepository securityContextRepository() {
        return new HttpSessionSecurityContextRepository();
    }

    
    @Bean
    public SecurityFilterChain filtroSeguranca(
            HttpSecurity http,
            SecurityContextRepository securityContextRepository,
            DaoAuthenticationProvider authenticationProvider)
            throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .authenticationProvider(authenticationProvider)
            .csrf(csrf -> csrf.disable())
            .securityContext(context -> context
                .securityContextRepository(securityContextRepository))
            .sessionManagement(session -> session
                .sessionCreationPolicy(
                    org.springframework.security.config.http.SessionCreationPolicy.IF_REQUIRED))
        .authorizeHttpRequests(autorizacao -> autorizacao
            .anyRequest().permitAll()
        )
            .formLogin(form -> form.disable())
            .httpBasic(basic -> basic.disable());

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    
@Bean
public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration configuracao = new CorsConfiguration();

    configuracao.setAllowedOrigins(
    java.util.List.of("http://localhost:5173")
    );
    configuracao.setAllowedMethods(
        java.util.List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
    );
    configuracao.setAllowedHeaders(
        java.util.List.of("*")
    );
    configuracao.setAllowCredentials(true);

    UrlBasedCorsConfigurationSource origem =
        new UrlBasedCorsConfigurationSource();

    origem.registerCorsConfiguration("/**", configuracao);

    return origem;
}

}
