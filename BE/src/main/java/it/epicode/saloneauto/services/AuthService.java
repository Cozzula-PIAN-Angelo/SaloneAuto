package it.epicode.saloneauto.services;

import it.epicode.saloneauto.entities.PasswordResetToken;
import it.epicode.saloneauto.entities.Ruolo;
import it.epicode.saloneauto.entities.Utente;
import it.epicode.saloneauto.events.ResetPasswordRichiestoEvent;
import it.epicode.saloneauto.exceptions.BadRequestException;
import it.epicode.saloneauto.exceptions.ConflictException;
import it.epicode.saloneauto.exceptions.UnauthorizedException;
import it.epicode.saloneauto.payloads.*;
import it.epicode.saloneauto.repositories.PasswordResetTokenRepository;
import it.epicode.saloneauto.repositories.UtenteRepository;
import it.epicode.saloneauto.security.JwtService;
import it.epicode.saloneauto.security.LimitatoreTentativi;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Locale;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AuthService {

    public static final long MINUTI_VALIDITA_RESET = 30;

    private final UtenteRepository utenteRepository;
    private final PasswordResetTokenRepository resetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final TokenService tokenService;
    private final ApplicationEventPublisher eventPublisher;
    private final LimitatoreTentativi limitatore;

    // Hash fittizio: il login con email inesistente impiega lo stesso tempo di una password errata
    private String hashFittizio;

    public static String normalizzaEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    @Transactional
    public UtenteResponse registra(RegistrazioneRequest body, String ip) {
        // Prima del controllo sull'email: limita chi prova molte email per scoprire quali esistono
        limitatore.registrazione(ip);
        String email = normalizzaEmail(body.email());
        if (utenteRepository.existsByEmail(email)) {
            throw new ConflictException("Email già registrata");
        }
        // Il ruolo lo decide il server: dalla registrazione si diventa solo USER
        Utente utente = new Utente(body.nome().trim(), body.cognome().trim(), email,
                passwordEncoder.encode(body.password()), Ruolo.USER);
        return UtenteResponse.da(utenteRepository.save(utente));
    }

    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest body, String ip) {
        String email = normalizzaEmail(body.email());
        // Stesso limite che l'email esista o no: il 429 non rivela quali email sono registrate
        limitatore.verificaLogin(ip, email);
        Optional<Utente> utente = utenteRepository.findByEmail(email);
        if (utente.isEmpty()) {
            passwordEncoder.matches(body.password(), hashFittizio());
            limitatore.loginFallito(ip, email);
            throw credenzialiErrate();
        }
        if (!passwordEncoder.matches(body.password(), utente.get().getPassword())) {
            limitatore.loginFallito(ip, email);
            throw credenzialiErrate();
        }
        limitatore.loginRiuscito(ip, email);
        return new LoginResponse(jwtService.genera(utente.get().getId(), utente.get().getVersioneToken()));
    }

    /**
     * Stessa risposta che l'email esista o no. Se esiste si crea un token monouso
     * e la mail parte dopo il commit, in modo asincrono.
     */
    @Transactional
    public void passwordDimenticata(PasswordDimenticataRequest body) {
        String email = normalizzaEmail(body.email());
        // Contata anche se l'email non esiste, così il 429 non rivela niente
        limitatore.passwordDimenticata(email);
        utenteRepository.findByEmail(email).ifPresent(utente -> {
            resetTokenRepository.deleteByUtenteId(utente.getId());
            String token = tokenService.generaToken();
            resetTokenRepository.save(new PasswordResetToken(utente, tokenService.hash(token),
                    LocalDateTime.now().plusMinutes(MINUTI_VALIDITA_RESET)));
            eventPublisher.publishEvent(new ResetPasswordRichiestoEvent(
                    utente.getId(), utente.getNome(), utente.getEmail(), token));
        });
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest body) {
        PasswordResetToken reset = resetTokenRepository.findByTokenHash(tokenService.hash(body.token()))
                .filter(t -> !t.isUsato() && t.getScadenza().isAfter(LocalDateTime.now()))
                .orElseThrow(() -> new BadRequestException("Link non valido o scaduto"));
        reset.setUsato(true);
        Utente utente = reset.getUtente();
        utente.setPassword(passwordEncoder.encode(body.nuovaPassword()));
        // Chi aveva un token (anche rubato) deve rifare il login con la nuova password
        utente.setVersioneToken(utente.getVersioneToken() + 1);
    }

    private UnauthorizedException credenzialiErrate() {
        return new UnauthorizedException("Email o password non corretti");
    }

    private String hashFittizio() {
        if (hashFittizio == null) {
            hashFittizio = passwordEncoder.encode(tokenService.generaToken());
        }
        return hashFittizio;
    }
}
