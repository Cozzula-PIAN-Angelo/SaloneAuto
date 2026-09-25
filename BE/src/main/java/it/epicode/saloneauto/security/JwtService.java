package it.epicode.saloneauto.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Optional;

/**
 * Il token contiene solo sub (id utente), ver (versione dei token dell'utente),
 * iat ed exp: niente email né ruolo. Il ruolo viene riletto dal DB a ogni
 * richiesta (vedi JwtFilter).
 */
@Service
public class JwtService {

    public record DatiToken(Long idUtente, int versione) {
    }

    private static final String CLAIM_VERSIONE = "ver";

    private final SecretKey chiave;
    private final long durataMs;

    public JwtService(@Value("${jwt.secret}") String secret, @Value("${jwt.expiration-ms}") long durataMs) {
        // hmacShaKeyFor rifiuta chiavi sotto i 256 bit: l'app non parte con un segreto debole
        this.chiave = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.durataMs = durataMs;
    }

    public String genera(Long idUtente, int versione) {
        Date adesso = new Date();
        return Jwts.builder()
                .subject(String.valueOf(idUtente))
                .claim(CLAIM_VERSIONE, versione)
                .issuedAt(adesso)
                .expiration(new Date(adesso.getTime() + durataMs))
                .signWith(chiave)
                .compact();
    }

    public Optional<DatiToken> leggi(String token) {
        try {
            Claims claims = Jwts.parser().verifyWith(chiave).build()
                    .parseSignedClaims(token).getPayload();
            // I token emessi prima dell'introduzione di "ver" valgono come versione 0
            Integer versione = claims.get(CLAIM_VERSIONE, Integer.class);
            return Optional.of(new DatiToken(Long.valueOf(claims.getSubject()),
                    versione == null ? 0 : versione));
        } catch (JwtException | IllegalArgumentException e) {
            return Optional.empty();
        }
    }
}
