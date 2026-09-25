package it.epicode.saloneauto.security;

import it.epicode.saloneauto.repositories.UtenteRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Non è un @Component, altrimenti Spring Boot lo registrerebbe una seconda volta
 * come filtro servlet: viene istanziato solo dentro SecurityConfig.
 * Un token assente o non valido lascia la richiesta anonima; saranno le regole
 * di SecurityConfig a rispondere 401 sugli endpoint protetti.
 */
public class JwtFilter extends OncePerRequestFilter {

    private static final String PREFISSO = "Bearer ";

    private final JwtService jwtService;
    private final UtenteRepository utenteRepository;

    public JwtFilter(JwtService jwtService, UtenteRepository utenteRepository) {
        this.jwtService = jwtService;
        this.utenteRepository = utenteRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith(PREFISSO)) {
            jwtService.leggi(header.substring(PREFISSO.length()))
                    .flatMap(dati -> utenteRepository.findById(dati.idUtente())
                            // Versione diversa = token emesso prima di un reset della password
                            .filter(utente -> utente.getVersioneToken() == dati.versione()))
                    .ifPresent(utente -> SecurityContextHolder.getContext().setAuthentication(
                            new UsernamePasswordAuthenticationToken(utente, null, utente.getAuthorities())));
        }
        chain.doFilter(request, response);
    }
}
