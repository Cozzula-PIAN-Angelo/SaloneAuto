package it.epicode.saloneauto.entities;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "avvisi", uniqueConstraints = @UniqueConstraint(columnNames = {"utente_id", "auto_id"}))
@Getter
@Setter
@NoArgsConstructor
public class Avviso {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "utente_id")
    private Utente utente;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "auto_id")
    private Auto auto;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal soglia;

    @Column(nullable = false)
    private boolean attivo;

    @Column(nullable = false)
    private LocalDateTime dataCreazione;

    private LocalDateTime ultimaNotifica;

    // Hash SHA-256 del token monouso inserito nel link della mail; il token in chiaro non viene salvato
    @Column(unique = true, length = 64)
    private String tokenDisattivazioneHash;

    public Avviso(Utente utente, Auto auto, BigDecimal soglia) {
        this.utente = utente;
        this.auto = auto;
        this.soglia = soglia;
        this.attivo = true;
        this.dataCreazione = LocalDateTime.now();
    }
}
