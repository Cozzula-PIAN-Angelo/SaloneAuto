package it.epicode.saloneauto;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import java.nio.charset.StandardCharsets;
import java.util.Base64;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** "Ogni indirizzo risponde solo a chi ne ha diritto." */
class AccessoTest extends IntegrationTestBase {

    @Test
    void cambiarePrezzo_senzaToken401_utente403_admin200() throws Exception {
        long autoId = creaAuto("Panda", "10000", "PUBBLICATO");
        String prezzo = "{\"prezzo\":1}";

        mockMvc.perform(patch("/api/admin/auto/" + autoId + "/prezzo")
                        .contentType(MediaType.APPLICATION_JSON).content(prezzo))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(conToken(patch("/api/admin/auto/" + autoId + "/prezzo"), nuovoUtente())
                        .contentType(MediaType.APPLICATION_JSON).content(prezzo))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));

        mockMvc.perform(get("/api/auto/" + autoId)).andExpect(jsonPath("$.prezzo").value(10000));

        mockMvc.perform(conToken(patch("/api/admin/auto/" + autoId + "/prezzo"), admin())
                        .contentType(MediaType.APPLICATION_JSON).content("{\"prezzo\":9500}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.prezzo").value(9500));
    }

    @Test
    void utenteNonPuoCreareNeModificareAnnunci() throws Exception {
        String utente = nuovoUtente();
        long autoId = creaAuto("Punto", "8000", "PUBBLICATO");

        mockMvc.perform(conToken(post("/api/admin/auto"), utente)
                        .contentType(MediaType.APPLICATION_JSON).content(autoJson("X", "1", "PUBBLICATO")))
                .andExpect(status().isForbidden());
        mockMvc.perform(conToken(put("/api/admin/auto/" + autoId), utente)
                        .contentType(MediaType.APPLICATION_JSON).content(autoJson("X", "1", "PUBBLICATO")))
                .andExpect(status().isForbidden());
        mockMvc.perform(conToken(patch("/api/admin/auto/" + autoId + "/stato"), utente)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"statoAnnuncio\":\"BOZZA\"}"))
                .andExpect(status().isForbidden());
        mockMvc.perform(conToken(get("/api/admin/auto"), utente))
                .andExpect(status().isForbidden());
    }

    @Test
    void avvisoDiUnAltroUtente_risponde404() throws Exception {
        long autoId = creaAuto("Golf", "20000", "PUBBLICATO");
        String proprietario = nuovoUtente();
        aggiungiPreferito(proprietario, autoId);
        long avvisoId = creaAvviso(proprietario, autoId, "18000");

        String altro = nuovoUtente();
        mockMvc.perform(conToken(get("/api/avvisi/" + avvisoId), altro))
                .andExpect(status().isNotFound());
        mockMvc.perform(conToken(put("/api/avvisi/" + avvisoId), altro)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"soglia\":100,\"attivo\":false}"))
                .andExpect(status().isNotFound());
        mockMvc.perform(conToken(delete("/api/avvisi/" + avvisoId), altro))
                .andExpect(status().isNotFound());

        // Stessa risposta di un id che non esiste proprio
        String inesistente = mockMvc.perform(conToken(get("/api/avvisi/999999"), altro))
                .andExpect(status().isNotFound()).andReturn().getResponse().getContentAsString();
        String altrui = mockMvc.perform(conToken(get("/api/avvisi/" + avvisoId), altro))
                .andReturn().getResponse().getContentAsString();
        assertThat(senzaTimestamp(altrui)).isEqualTo(senzaTimestamp(inesistente));

        // L'avviso del proprietario è intatto
        mockMvc.perform(conToken(get("/api/avvisi/" + avvisoId), proprietario))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.soglia").value(18000))
                .andExpect(jsonPath("$.attivo").value(true));
    }

    @Test
    void preferitoDiUnAltroUtente_risponde404() throws Exception {
        long autoId = creaAuto("Polo", "15000", "PUBBLICATO");
        String proprietario = nuovoUtente();
        long preferitoId = aggiungiPreferito(proprietario, autoId);

        mockMvc.perform(conToken(delete("/api/preferiti/" + preferitoId), nuovoUtente()))
                .andExpect(status().isNotFound());
        mockMvc.perform(conToken(get("/api/preferiti"), proprietario))
                .andExpect(jsonPath("$[0].id").value(preferitoId));
    }

    @Test
    void preferitiEAvvisiRichiedonoLogin() throws Exception {
        mockMvc.perform(get("/api/preferiti")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/avvisi")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/me")).andExpect(status().isUnauthorized());
        mockMvc.perform(conToken(get("/api/me"), "token.non.valido")).andExpect(status().isUnauthorized());
    }

    @Test
    void jwtContieneSoloSubVerIatExp() throws Exception {
        String token = nuovoUtente();
        String payload = new String(Base64.getUrlDecoder().decode(token.split("\\.")[1]), StandardCharsets.UTF_8);

        assertThat(payload).contains("\"sub\"", "\"ver\"", "\"iat\"", "\"exp\"");
        assertThat(payload.replaceAll("\"(sub|ver|iat|exp)\":\"?[^,}\"]*\"?", "")).isEqualTo("{,,,}");
        assertThat(payload).doesNotContain("@", "USER", "ruolo", "role");
    }

    // ===== Mass assignment: campi extra nel body non cambiano niente =====

    @Test
    void registrazioneConRuoloAdmin_creaComunqueUnUser() throws Exception {
        String email = emailUnica();
        mockMvc.perform(post("/api/auth/registrazione").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nome\":\"Eva\",\"cognome\":\"Neri\",\"email\":\"" + email + "\","
                                + "\"password\":\"" + PASSWORD + "\",\"ruolo\":\"ADMIN\",\"id\":1}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.ruolo").value("USER"))
                .andExpect(jsonPath("$.password").doesNotExist());

        String token = login(email, PASSWORD);
        mockMvc.perform(conToken(get("/api/me"), token)).andExpect(jsonPath("$.ruolo").value("USER"));
        mockMvc.perform(conToken(get("/api/admin/auto"), token)).andExpect(status().isForbidden());
    }

    @Test
    void profiloConRuoloEdEmailNelBody_cambiaSoloNomeECognome() throws Exception {
        String email = emailUnica();
        String token = nuovoUtente("Luca", email);

        mockMvc.perform(conToken(put("/api/me"), token).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nome\":\"Luca2\",\"cognome\":\"Bianchi\",\"ruolo\":\"ADMIN\","
                                + "\"email\":\"altro@test.it\",\"id\":1,\"password\":\"x\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nome").value("Luca2"))
                .andExpect(jsonPath("$.email").value(email))
                .andExpect(jsonPath("$.ruolo").value("USER"));

        // La password non è cambiata
        login(email, PASSWORD);
    }

    @Test
    void avvisoConUtenteIdEInviatoNelBody_nonCambiaProprietarioNeStato() throws Exception {
        long autoId = creaAuto("Clio", "12000", "PUBBLICATO");
        String vittima = nuovoUtente();
        aggiungiPreferito(vittima, autoId);
        long avvisoVittima = creaAvviso(vittima, autoId, "11000");

        String attaccante = nuovoUtente();
        long idAttaccante = idUtente(attaccante);
        aggiungiPreferito(attaccante, autoId);
        String body = mockMvc.perform(conToken(post("/api/avvisi"), attaccante).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"autoId\":" + autoId + ",\"soglia\":11500,\"utenteId\":" + (idAttaccante + 1)
                                + ",\"inviato\":true,\"ultimaNotifica\":\"2020-01-01T00:00:00\",\"attivo\":false}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.attivo").value(true))
                .andExpect(jsonPath("$.ultimaNotifica").value(nullValue()))
                .andReturn().getResponse().getContentAsString();
        long avvisoAttaccante = ((Number) com.jayway.jsonpath.JsonPath.read(body, "$.id")).longValue();

        // L'avviso creato appartiene all'attaccante, non ad altri
        mockMvc.perform(conToken(get("/api/avvisi/" + avvisoAttaccante), attaccante)).andExpect(status().isOk());
        mockMvc.perform(conToken(get("/api/avvisi/" + avvisoAttaccante), vittima)).andExpect(status().isNotFound());

        // Un PUT sul proprio avviso con utenteId nel body non lo sposta a un altro utente
        mockMvc.perform(conToken(put("/api/avvisi/" + avvisoAttaccante), attaccante)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"soglia\":11000,\"attivo\":true,\"utenteId\":1,\"inviato\":true,\"id\":"
                                + avvisoVittima + "}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(avvisoAttaccante))
                .andExpect(jsonPath("$.ultimaNotifica").value(nullValue()));
        mockMvc.perform(conToken(get("/api/avvisi/" + avvisoAttaccante), attaccante)).andExpect(status().isOk());
        mockMvc.perform(conToken(get("/api/avvisi/" + avvisoVittima), vittima))
                .andExpect(jsonPath("$.soglia").value(11000));
    }

    private long idUtente(String token) throws Exception {
        String body = mockMvc.perform(conToken(get("/api/me"), token)).andReturn().getResponse().getContentAsString();
        return ((Number) com.jayway.jsonpath.JsonPath.read(body, "$.id")).longValue();
    }

    private static String senzaTimestamp(String json) {
        return json.replaceAll("\"timestamp\":\"[^\"]*\"", "");
    }
}
