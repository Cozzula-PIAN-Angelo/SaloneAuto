package it.epicode.saloneauto.config;

import it.epicode.saloneauto.entities.Ruolo;
import it.epicode.saloneauto.entities.Utente;
import it.epicode.saloneauto.repositories.UtenteRepository;
import it.epicode.saloneauto.services.AuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Dalla registrazione si diventa solo USER: l'amministratore iniziale viene creato
 * all'avvio a partire da ADMIN_EMAIL / ADMIN_PASSWORD (nel .env), se impostati.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class AdminSeeder implements CommandLineRunner {

    private final UtenteRepository utenteRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.email:}")
    private String email;

    @Value("${app.admin.password:}")
    private String password;

    @Override
    public void run(String... args) {
        if (email.isBlank() || password.isBlank()) {
            return;
        }
        String normalizzata = AuthService.normalizzaEmail(email);
        if (utenteRepository.existsByEmail(normalizzata)) {
            return;
        }
        Utente admin = utenteRepository.save(new Utente("Admin", "Salone", normalizzata,
                passwordEncoder.encode(password), Ruolo.ADMIN));
        log.info("Creato l'amministratore iniziale (id={})", admin.getId());
    }
}
