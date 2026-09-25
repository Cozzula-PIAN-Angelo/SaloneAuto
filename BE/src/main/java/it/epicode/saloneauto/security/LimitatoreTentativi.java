package it.epicode.saloneauto.security;

import it.epicode.saloneauto.exceptions.TroppiTentativiException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

/**
 * Limite di tentativi a finestra scorrevole, in memoria: si azzera al riavvio dell'app
 * e non è condiviso tra più istanze, sufficiente per un'unica istanza.
 * - login: tentativi FALLITI per coppia IP + email (un login riuscito azzera il conteggio);
 * - registrazione: richieste per IP, così non si possono provare molte email per scoprire
 *   quali sono registrate (la registrazione risponde 409 se l'email esiste);
 * - password dimenticata: richieste per email, così non si inondano di mail le persone.
 * Le chiavi contengono l'email: la mappa non va mai loggata.
 */
@Component
public class LimitatoreTentativi {

    static final Duration FINESTRA_LOGIN = Duration.ofMinutes(15);
    static final Duration FINESTRA_ORARIA = Duration.ofHours(1);

    private final Map<String, Deque<Instant>> tentativi = new ConcurrentHashMap<>();
    private final int loginFallitiMax;
    private final int registrazioniPerOra;
    private final int passwordDimenticataPerOra;
    private final Clock clock;

    @Autowired
    public LimitatoreTentativi(@Value("${app.limiti.login-falliti:5}") int loginFallitiMax,
                               @Value("${app.limiti.registrazioni-per-ora:10}") int registrazioniPerOra,
                               @Value("${app.limiti.password-dimenticata-per-ora:3}") int passwordDimenticataPerOra) {
        this(loginFallitiMax, registrazioniPerOra, passwordDimenticataPerOra, Clock.systemUTC());
    }

    LimitatoreTentativi(int loginFallitiMax, int registrazioniPerOra, int passwordDimenticataPerOra, Clock clock) {
        this.loginFallitiMax = loginFallitiMax;
        this.registrazioniPerOra = registrazioniPerOra;
        this.passwordDimenticataPerOra = passwordDimenticataPerOra;
        this.clock = clock;
    }

    /** Da chiamare prima di verificare la password: oltre il limite nemmeno si prova. */
    public void verificaLogin(String ip, String email) {
        if (aggiorna(chiaveLogin(ip, email), loginFallitiMax, FINESTRA_LOGIN, false)) {
            throw new TroppiTentativiException();
        }
    }

    public void loginFallito(String ip, String email) {
        aggiorna(chiaveLogin(ip, email), Integer.MAX_VALUE, FINESTRA_LOGIN, true);
    }

    public void loginRiuscito(String ip, String email) {
        tentativi.remove(chiaveLogin(ip, email));
    }

    public void registrazione(String ip) {
        consuma("registrazione:" + ip, registrazioniPerOra, FINESTRA_ORARIA);
    }

    public void passwordDimenticata(String email) {
        consuma("password-dimenticata:" + email, passwordDimenticataPerOra, FINESTRA_ORARIA);
    }

    /** Toglie dalla memoria i tentativi usciti da ogni finestra. */
    @Scheduled(fixedRate = 10, timeUnit = TimeUnit.MINUTES)
    public void pulisci() {
        tentativi.keySet().forEach(chiave -> aggiorna(chiave, Integer.MAX_VALUE, FINESTRA_ORARIA, false));
    }

    private void consuma(String chiave, int massimo, Duration finestra) {
        if (aggiorna(chiave, massimo, finestra, true)) {
            throw new TroppiTentativiException();
        }
    }

    /**
     * Scarta i tentativi fuori finestra e, se conta è true e il limite non è raggiunto,
     * registra quello attuale. Tutto dentro compute: atomico per chiave.
     *
     * @return true se il limite era già raggiunto
     */
    private boolean aggiorna(String chiave, int massimo, Duration finestra, boolean conta) {
        Instant adesso = clock.instant();
        Instant inizio = adesso.minus(finestra);
        boolean[] superato = {false};
        tentativi.compute(chiave, (k, lista) -> {
            Deque<Instant> d = lista == null ? new ArrayDeque<>() : lista;
            while (!d.isEmpty() && !d.peekFirst().isAfter(inizio)) {
                d.pollFirst();
            }
            superato[0] = d.size() >= massimo;
            if (conta && !superato[0]) {
                d.addLast(adesso);
            }
            return d.isEmpty() ? null : d;
        });
        return superato[0];
    }

    private static String chiaveLogin(String ip, String email) {
        return "login:" + ip + "|" + email;
    }
}
