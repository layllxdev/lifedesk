
package com.lifedesk.usuario;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/admin/usuarios")
@PreAuthorize("hasRole('ADMIN')")
public class AdminUsuarioController {

    private final UsuarioRepository usuarioRepository;
    private final UsuarioService usuarioService;

    public AdminUsuarioController(
            UsuarioRepository usuarioRepository,
            UsuarioService usuarioService) {
        this.usuarioRepository = usuarioRepository;
        this.usuarioService = usuarioService;
    }

    @GetMapping
    public List<UsuarioResponse> listar() {
        return usuarioRepository.findAll().stream()
            .map(usuario -> new UsuarioResponse(
                usuario.getId(),
                usuario.getNome(),
                usuario.getEmail(),
                usuario.isAdministrador(),
                usuario.isAtivo()
            ))
            .toList();
    }

    @PatchMapping("/{id}/aprovar")
    public UsuarioResponse aprovar(@PathVariable Long id) {
        try {
            Usuario usuario = usuarioService.aprovarUsuario(id);
            return new UsuarioResponse(
                usuario.getId(),
                usuario.getNome(),
                usuario.getEmail(),
                usuario.isAdministrador(),
                usuario.isAtivo()
            );
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                e.getMessage()
            );
        }
    }

    public record UsuarioResponse(
        Long id,
        String nome,
        String email,
        boolean administrador,
        boolean ativo
    ) {}
}
