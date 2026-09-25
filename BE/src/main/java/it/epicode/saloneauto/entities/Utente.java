package it.epicode.saloneauto.entities;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

@Entity
@Table(name = "utenti")
@Getter
@Setter
@NoArgsConstructor
public class Utente implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String nome;

    @Column(nullable = false, length = 50)
    private String cognome;

    // Salvata sempre in minuscolo (vedi AuthService.normalizzaEmail)
    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Ruolo ruolo;

    @Column(nullable = false)
    private LocalDateTime dataRegistrazione;

    // Finisce nel JWT: incrementarla invalida tutti i token già emessi (vedi JwtFilter)
    @ColumnDefault("0")
    @Column(nullable = false)
    private int versioneToken;

    public Utente(String nome, String cognome, String email, String password, Ruolo ruolo) {
        this.nome = nome;
        this.cognome = cognome;
        this.email = email;
        this.password = password;
        this.ruolo = ruolo;
        this.dataRegistrazione = LocalDateTime.now();
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + ruolo.name()));
    }

    @Override
    public String getUsername() {
        return email;
    }

    // Niente @ToString di Lombok: email e hash della password non devono finire nei log
    @Override
    public String toString() {
        return "Utente[id=" + id + "]";
    }
}
