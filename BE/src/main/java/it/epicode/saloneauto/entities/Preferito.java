package it.epicode.saloneauto.entities;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "preferiti", uniqueConstraints = @UniqueConstraint(columnNames = {"utente_id", "auto_id"}))
@Getter
@Setter
@NoArgsConstructor
public class Preferito {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "utente_id")
    private Utente utente;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "auto_id")
    private Auto auto;

    @Column(nullable = false)
    private LocalDateTime dataAggiunta;

    public Preferito(Utente utente, Auto auto) {
        this.utente = utente;
        this.auto = auto;
        this.dataAggiunta = LocalDateTime.now();
    }
}
