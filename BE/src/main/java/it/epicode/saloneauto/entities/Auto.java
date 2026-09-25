package it.epicode.saloneauto.entities;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.BatchSize;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "auto")
@Getter
@Setter
@NoArgsConstructor
public class Auto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String titolo;

    // Colonne nullable a livello DB perché ddl-auto=update deve poterle aggiungere
    // anche su tabelle già popolate; l'obbligatorietà è garantita da AutoRequest.
    @Column(length = 50)
    private String marca;

    @Column(length = 80)
    private String modello;

    private Integer anno;

    // Facoltativo; se presente identifica un solo annuncio
    @Column(length = 17, unique = true)
    private String vin;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String descrizione;

    @Column(nullable = false)
    private Integer chilometraggio;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Carburante carburante;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Condizione condizione;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal prezzo;

    // Prezzo al momento del passaggio da PUBBLICATO a BOZZA: alla ripubblicazione gli avvisi
    // confrontano il nuovo prezzo con quest'ultimo prezzo visto dal pubblico. Null se pubblicato.
    @Column(precision = 12, scale = 2)
    private BigDecimal prezzoAlRitiro;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatoAnnuncio statoAnnuncio;

    @Column(nullable = false)
    private LocalDateTime dataCreazione;

    private LocalDateTime dataPubblicazione;

    // BatchSize evita l'N+1 quando si carica una pagina di annunci con le relative immagini
    @OneToMany(mappedBy = "auto", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("ordine ASC")
    @BatchSize(size = 50)
    private List<ImmagineAuto> immagini = new ArrayList<>();
}
