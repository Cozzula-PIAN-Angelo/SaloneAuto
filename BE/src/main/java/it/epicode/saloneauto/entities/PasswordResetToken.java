package it.epicode.saloneauto.entities;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "password_reset_token")
@Getter
@Setter
@NoArgsConstructor
public class PasswordResetToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "utente_id")
    private Utente utente;

    // Hash SHA-256 del token: il token in chiaro esiste solo nella mail
    @Column(nullable = false, unique = true, length = 64)
    private String tokenHash;

    @Column(nullable = false)
    private LocalDateTime scadenza;

    @Column(nullable = false)
    private boolean usato;

    public PasswordResetToken(Utente utente, String tokenHash, LocalDateTime scadenza) {
        this.utente = utente;
        this.tokenHash = tokenHash;
        this.scadenza = scadenza;
    }
}
