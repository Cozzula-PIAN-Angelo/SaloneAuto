package it.epicode.saloneauto;

import com.jayway.jsonpath.JsonPath;
import it.epicode.saloneauto.services.autodev.AutoDevClient;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.AbstractMockHttpServletRequestBuilder;

import java.util.UUID;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Contesto Spring completo su H2, con JavaMailSender e AutoDevClient sostituiti da mock.
 * I mock stanno qui (e non nelle singole classi) così tutti i test condividono lo stesso
 * contesto e lo stesso DB. Ogni test crea utenti con email univoche.
 */
@SpringBootTest
@AutoConfigureMockMvc
public abstract class IntegrationTestBase {

    protected static final String PASSWORD = "Password123!";

    @Autowired
    protected MockMvc mockMvc;

    @MockitoBean
    protected JavaMailSender mailSender;

    @MockitoBean
    protected AutoDevClient autoDevClient;

    @BeforeEach
    void stubMailSender() {
        when(mailSender.createMimeMessage()).thenAnswer(inv -> new MimeMessage((Session) null));
    }

    protected static String emailUnica() {
        return "utente-" + UUID.randomUUID() + "@test.it";
    }

    protected static String jsonString(String valore) {
        return "\"" + valore.replace("\\", "\\\\").replace("\"", "\\\"") + "\"";
    }

    protected void registra(String nome, String email) throws Exception {
        mockMvc.perform(post("/api/auth/registrazione").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nome\":" + jsonString(nome) + ",\"cognome\":\"Rossi\",\"email\":"
                                + jsonString(email) + ",\"password\":\"" + PASSWORD + "\"}"))
                .andExpect(status().isCreated());
    }

    protected String login(String email, String password) throws Exception {
        String body = mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":" + jsonString(email) + ",\"password\":" + jsonString(password) + "}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return JsonPath.read(body, "$.token");
    }

    /** Registra un nuovo USER e restituisce il suo JWT. */
    protected String nuovoUtente() throws Exception {
        return nuovoUtente("Mario", emailUnica());
    }

    protected String nuovoUtente(String nome, String email) throws Exception {
        registra(nome, email);
        return login(email, PASSWORD);
    }

    protected String admin() throws Exception {
        return login("admin@test.it", "AdminPass123!");
    }

    protected static <B extends AbstractMockHttpServletRequestBuilder<B>> B conToken(B req, String token) {
        return req.header("Authorization", "Bearer " + token);
    }

    protected long creaAuto(String titolo, String prezzo, String stato) throws Exception {
        String body = mockMvc.perform(conToken(post("/api/admin/auto"), admin())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(autoJson(titolo, prezzo, stato)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return ((Number) JsonPath.read(body, "$.id")).longValue();
    }

    protected static String autoJson(String titolo, String prezzo, String stato) {
        return "{\"titolo\":" + jsonString(titolo) + ",\"marca\":\"Fiat\",\"modello\":\"Panda\",\"anno\":2020,"
                + "\"descrizione\":\"Auto in ottime condizioni\","
                + "\"chilometraggio\":15000,\"carburante\":\"BENZINA\",\"condizione\":\"USATO\","
                + "\"prezzo\":" + prezzo + ",\"statoAnnuncio\":\"" + stato + "\"}";
    }

    protected void cambiaPrezzo(long autoId, String prezzo) throws Exception {
        mockMvc.perform(conToken(patch("/api/admin/auto/" + autoId + "/prezzo"), admin())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"prezzo\":" + prezzo + "}"))
                .andExpect(status().isOk());
    }

    protected long aggiungiPreferito(String token, long autoId) throws Exception {
        String body = mockMvc.perform(conToken(post("/api/preferiti"), token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"autoId\":" + autoId + "}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return ((Number) JsonPath.read(body, "$.id")).longValue();
    }

    protected long creaAvviso(String token, long autoId, String soglia) throws Exception {
        String body = mockMvc.perform(conToken(post("/api/avvisi"), token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"autoId\":" + autoId + ",\"soglia\":" + soglia + "}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return ((Number) JsonPath.read(body, "$.id")).longValue();
    }
}
