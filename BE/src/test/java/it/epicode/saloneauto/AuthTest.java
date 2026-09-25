package it.epicode.saloneauto;

import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.ResultActions;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.startsWith;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AuthTest extends IntegrationTestBase {

    @Test
    void loginErrato_stessaRispostaPerEmailInesistenteEPasswordSbagliata() throws Exception {
        String email = emailUnica();
        registra("Anna", email);

        String passwordSbagliata = tentaLogin(email, "PasswordSbagliata1")
                .andExpect(status().isUnauthorized()).andReturn().getResponse().getContentAsString();
        String emailInesistente = tentaLogin(emailUnica(), PASSWORD)
                .andExpect(status().isUnauthorized()).andReturn().getResponse().getContentAsString();

        assertThat(senzaTimestamp(passwordSbagliata)).isEqualTo(senzaTimestamp(emailInesistente));
    }

    @Test
    void emailNormalizzata_eDuplicatoRifiutato() throws Exception {
        String email = emailUnica();
        registra("Anna", email);
        login(email.toUpperCase(), PASSWORD);

        mockMvc.perform(post("/api/auth/registrazione").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nome\":\"A\",\"cognome\":\"B\",\"email\":\"" + email.toUpperCase()
                                + "\",\"password\":\"" + PASSWORD + "\"}"))
                .andExpect(status().isConflict());
    }

    @Test
    void registrazioneNonValida() throws Exception {
        mockMvc.perform(post("/api/auth/registrazione").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nome\":\"\",\"cognome\":\"B\",\"email\":\"non-una-mail\",\"password\":\"corta\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errori.length()").value(3));
    }

    @Test
    void passwordOltre72Byte_400ENon500() throws Exception {
        // 40 caratteri ma 80 byte: supera il limite di BCrypt pur restando sotto i 72 caratteri
        String accentata = "è".repeat(40);
        String email = emailUnica();

        registrazione(email, accentata)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errori[0]").value(startsWith("password:")));
        tentaLogin(emailUnica(), accentata).andExpect(status().isBadRequest());
        reset("token-qualsiasi", accentata).andExpect(status().isBadRequest());

        // 36 caratteri accentati = 72 byte: ancora accettata
        registrazione(email, "è".repeat(36)).andExpect(status().isCreated());
        login(email, "è".repeat(36));
    }

    @Test
    void login_dopo5Fallimenti_429AncheConLaPasswordGiusta() throws Exception {
        String email = emailUnica();
        registra("Anna", email);

        for (int i = 0; i < 5; i++) {
            tentaLogin(email, "PasswordSbagliata1").andExpect(status().isUnauthorized());
        }
        tentaLogin(email, PASSWORD)
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.messaggio").value("Troppi tentativi, riprova più tardi"));
    }

    @Test
    void passwordDimenticata_oltre3AllOra_429() throws Exception {
        String email = emailUnica();
        for (int i = 0; i < 3; i++) {
            passwordDimenticata(email).andExpect(status().isOk());
        }
        passwordDimenticata(email).andExpect(status().isTooManyRequests());
    }

    @Test
    void passwordDimenticata_emailInesistente_stessaRisposta_nessunaMail() throws Exception {
        passwordDimenticata(emailUnica())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.messaggio").value("Se l'indirizzo è registrato, riceverai una mail con le istruzioni"));
        verify(mailSender, after(1000).never()).send(any(MimeMessage.class));
    }

    @Test
    void resetPassword_linkMonouso() throws Exception {
        String email = emailUnica();
        registra("Anna", email);

        String token = tokenDiReset(email);

        reset(token, "NuovaPassword1").andExpect(status().isOk());
        reset(token, "AltraPassword1").andExpect(status().isBadRequest());
        reset("token-inventato", "AltraPassword1").andExpect(status().isBadRequest());

        tentaLogin(email, PASSWORD).andExpect(status().isUnauthorized());
        login(email, "NuovaPassword1");
    }

    @Test
    void resetPassword_invalidaIJwtGiaEmessi() throws Exception {
        String email = emailUnica();
        String jwtVecchio = nuovoUtente("Anna", email);
        mockMvc.perform(conToken(get("/api/me"), jwtVecchio)).andExpect(status().isOk());

        reset(tokenDiReset(email), "NuovaPassword1").andExpect(status().isOk());

        mockMvc.perform(conToken(get("/api/me"), jwtVecchio)).andExpect(status().isUnauthorized());
        String jwtNuovo = login(email, "NuovaPassword1");
        mockMvc.perform(conToken(get("/api/me"), jwtNuovo)).andExpect(status().isOk());
    }

    private String tokenDiReset(String email) throws Exception {
        passwordDimenticata(email).andExpect(status().isOk());
        ArgumentCaptor<MimeMessage> captor = ArgumentCaptor.forClass(MimeMessage.class);
        verify(mailSender, timeout(5000)).send(captor.capture());
        String html = (String) captor.getValue().getContent();
        Matcher m = Pattern.compile("reset-password\\?token=([A-Za-z0-9_-]+)").matcher(html);
        assertThat(m.find()).isTrue();
        return m.group(1);
    }

    private ResultActions tentaLogin(String email, String password) throws Exception {
        return mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":" + jsonString(email) + ",\"password\":" + jsonString(password) + "}"));
    }

    private ResultActions registrazione(String email, String password) throws Exception {
        return mockMvc.perform(post("/api/auth/registrazione").contentType(MediaType.APPLICATION_JSON)
                .content("{\"nome\":\"Anna\",\"cognome\":\"Rossi\",\"email\":" + jsonString(email)
                        + ",\"password\":" + jsonString(password) + "}"));
    }

    private ResultActions passwordDimenticata(String email) throws Exception {
        return mockMvc.perform(post("/api/auth/password-dimenticata").contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":" + jsonString(email) + "}"));
    }

    private ResultActions reset(String token, String nuovaPassword) throws Exception {
        return mockMvc.perform(post("/api/auth/reset-password").contentType(MediaType.APPLICATION_JSON)
                .content("{\"token\":" + jsonString(token) + ",\"nuovaPassword\":" + jsonString(nuovaPassword) + "}"));
    }

    private static String senzaTimestamp(String json) {
        return json.replaceAll("\"timestamp\":\"[^\"]*\"", "");
    }
}
