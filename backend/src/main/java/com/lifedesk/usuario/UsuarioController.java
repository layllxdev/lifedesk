
package com.lifedesk.usuario;

import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@RestController
@RequestMapping("/api/auth")
public class UsuarioController {

    private final UsuarioService usuarioService;
    private final AuthenticationManager authenticationManager;
    private final UsuarioRepository usuarioRepository;
    private final SecurityContextRepository securityContextRepository;

    public UsuarioController(
            UsuarioService usuarioService,
            AuthenticationManager authenticationManager,
            UsuarioRepository usuarioRepository,
            SecurityContextRepository securityContextRepository) {
        this.usuarioService = usuarioService;
        this.authenticationManager = authenticationManager;
        this.usuarioRepository = usuarioRepository;
        this.securityContextRepository = securityContextRepository;
    }

    @PostMapping("/cadastro")
    @ResponseStatus(HttpStatus.CREATED)
    public String cadastrar(@RequestBody CadastroRequest request) {
        if (request.nome() == null || request.email() == null
                || request.senha() == null || request.nome().isBlank()
                || request.email().isBlank() || request.senha().length() < 8) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Informe nome, e-mail e senha com pelo menos 8 caracteres."
            );
        }

        try {
            usuarioService.criarUsuario(
                request.nome(),
                request.email(),
                request.senha()
            );
            return "Cadastro realizado. Aguarde a liberação do administrador.";
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, e.getMessage());
        }
    }

    @PostMapping("/login")
    public UsuarioResponse login(
            @RequestBody LoginRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {
        if (request.email() == null || request.senha() == null
                || request.email().isBlank() || request.senha().isBlank()) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST, "Informe e-mail e senha."
            );
        }

        try {
            Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                    request.email().trim().toLowerCase(),
                    request.senha()
                )
            );

            SecurityContext context = SecurityContextHolder.createEmptyContext();
            context.setAuthentication(authentication);
            SecurityContextHolder.setContext(context);
            securityContextRepository.saveContext(
                context, httpRequest, httpResponse
            );

            Usuario usuario = usuarioRepository.findByEmail(
                authentication.getName()
            ).orElseThrow();

            return new UsuarioResponse(
                usuario.getId(),
                usuario.getNome(),
                usuario.getEmail(),
                usuario.isAdministrador()
            );
        } catch (org.springframework.security.core.AuthenticationException e) {
            SecurityContextHolder.clearContext();
            throw new ResponseStatusException(
                HttpStatus.UNAUTHORIZED,
                "E-mail ou senha inválidos, ou conta ainda não liberada."
            );
        }
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(
            HttpServletRequest request,
            HttpServletResponse response) throws Exception {
        request.getSession(false);
        SecurityContextHolder.clearContext();
        request.logout();
        if (request.getSession(false) != null) {
            request.getSession(false).invalidate();
        }
    }

    @GetMapping("/me")
    public UsuarioResponse usuarioAtual(
            Authentication authentication) {

        Usuario usuario = usuarioRepository.findByEmail(
            authentication.getName()
        ).orElseThrow();

        return new UsuarioResponse(
           usuario.getId(),
           usuario.getNome(),
           usuario.getEmail(),
           usuario.isAdministrador()
        );
    }

    public record CadastroRequest(String nome, String email, String senha) {}
    public record LoginRequest(String email, String senha) {}
    public record UsuarioResponse(
        Long id, String nome, String email, boolean administrador
    ) {}
}
