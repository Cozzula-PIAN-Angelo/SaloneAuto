package it.epicode.saloneauto.entities;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "immagini_auto")
@Getter
@Setter
@NoArgsConstructor
public class ImmagineAuto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "auto_id")
    private Auto auto;

    // Nome generato dal server (UUID + estensione), mai quello inviato dal client
    @Column(nullable = false, unique = true)
    private String nomeFile;

    @Column(nullable = false)
    private Integer ordine;

    public ImmagineAuto(Auto auto, String nomeFile, Integer ordine) {
        this.auto = auto;
        this.nomeFile = nomeFile;
        this.ordine = ordine;
    }
}
