package it.epicode.saloneauto;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;

import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class CatalogoTest extends IntegrationTestBase {

    @Test
    void catalogoPubblico_ordinatoPerPrezzo_senzaLogin() throws Exception {
        String tag = UUID.randomUUID().toString().substring(0, 8);
        creaAuto("Media " + tag, "20000", "PUBBLICATO");
        creaAuto("Cara " + tag, "30000", "PUBBLICATO");
        creaAuto("Economica " + tag, "10000", "PUBBLICATO");

        mockMvc.perform(get("/api/auto").param("q", tag).param("ordinaPer", "prezzo").param("direzione", "asc"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totaleElementi").value(3))
                .andExpect(jsonPath("$.contenuto[*].prezzo", contains(10000.0, 20000.0, 30000.0)));

        mockMvc.perform(get("/api/auto").param("q", tag).param("ordinaPer", "prezzo").param("direzione", "desc")
                        .param("prezzoMax", "25000"))
                .andExpect(jsonPath("$.contenuto[*].prezzo", contains(20000.0, 10000.0)));
    }

    @Test
    void ordinamentoFuoriElenco_risponde400() throws Exception {
        for (String campo : new String[]{"password", "prezzo;drop table auto", "PREZZO", "id", "utente.email"}) {
            mockMvc.perform(get("/api/auto").param("ordinaPer", campo))
                    .andExpect(status().isBadRequest());
        }
        mockMvc.perform(get("/api/auto").param("ordinaPer", "prezzo").param("direzione", "asc; select 1"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(get("/api/auto").param("dimensione", "1000")).andExpect(status().isBadRequest());
        mockMvc.perform(get("/api/auto").param("carburante", "NUCLEARE")).andExpect(status().isBadRequest());
    }

    @Test
    void ricercaConJolly_cercaIlCarattereLetterale() throws Exception {
        String tag = UUID.randomUUID().toString().substring(0, 8);
        creaAuto("Sconto 100% " + tag, "9000", "PUBBLICATO");
        creaAuto("Senza sconto " + tag, "9000", "PUBBLICATO");

        mockMvc.perform(get("/api/auto").param("q", "%").param("dimensione", "50"))
                .andExpect(jsonPath("$.contenuto[*].titolo", everyItem(containsString("%"))));
        mockMvc.perform(get("/api/auto").param("q", "_").param("dimensione", "50"))
                .andExpect(jsonPath("$.contenuto[*].titolo", not(hasItem(containsString(tag)))));
        mockMvc.perform(get("/api/auto").param("q", "' OR '1'='1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totaleElementi").value(0));
    }

    @Test
    void bozzaInvisibileAlPubblico() throws Exception {
        String tag = UUID.randomUUID().toString().substring(0, 8);
        long bozza = creaAuto("Bozza " + tag, "5000", "BOZZA");

        mockMvc.perform(get("/api/auto").param("q", tag)).andExpect(jsonPath("$.totaleElementi").value(0));
        mockMvc.perform(get("/api/auto/" + bozza)).andExpect(status().isNotFound());
        mockMvc.perform(conToken(post("/api/preferiti"), nuovoUtente()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"autoId\":" + bozza + "}")).andExpect(status().isNotFound());

        // L'admin la vede e la pubblica
        mockMvc.perform(conToken(get("/api/admin/auto/" + bozza), admin())).andExpect(status().isOk());
        mockMvc.perform(conToken(patch("/api/admin/auto/" + bozza + "/stato"), admin())
                        .contentType(MediaType.APPLICATION_JSON).content("{\"statoAnnuncio\":\"PUBBLICATO\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.dataPubblicazione").isNotEmpty());
        mockMvc.perform(get("/api/auto/" + bozza)).andExpect(status().isOk());
    }

    @Test
    void validazioneAnnuncio() throws Exception {
        mockMvc.perform(conToken(post("/api/admin/auto"), admin()).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"titolo\":\"\",\"prezzo\":-5}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errori", not(empty())));
    }

    @Test
    void uploadImmagini_accettaSoloImmaginiVere() throws Exception {
        long autoId = creaAuto("Con foto", "7000", "PUBBLICATO");
        byte[] png = {(byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A, 0, 0, 0, 0};
        MockMultipartFile foto = new MockMultipartFile("files", "foto.png", "image/png", png);

        String body = mockMvc.perform(conToken(multipart("/api/admin/auto/" + autoId + "/immagini").file(foto), admin()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.immagini", hasSize(1)))
                .andExpect(jsonPath("$.immagini[0].url", matchesPattern("/uploads/[0-9a-f-]{36}\\.png")))
                .andReturn().getResponse().getContentAsString();
        String url = com.jayway.jsonpath.JsonPath.read(body, "$.immagini[0].url");

        mockMvc.perform(get(url)).andExpect(status().isOk());

        // Estensione e Content-Type dichiarati non contano: conta il contenuto
        MockMultipartFile finta = new MockMultipartFile("files", "foto.png", "image/png",
                "<script>alert(1)</script>".getBytes());
        mockMvc.perform(conToken(multipart("/api/admin/auto/" + autoId + "/immagini").file(finta), admin()))
                .andExpect(status().isBadRequest());

        mockMvc.perform(conToken(multipart("/api/admin/auto/" + autoId + "/immagini").file(foto), nuovoUtente()))
                .andExpect(status().isForbidden());

        long immagineId = ((Number) com.jayway.jsonpath.JsonPath.read(body, "$.immagini[0].id")).longValue();
        mockMvc.perform(conToken(delete("/api/admin/auto/" + autoId + "/immagini/" + immagineId), admin()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.immagini", empty()));
        mockMvc.perform(get(url)).andExpect(status().isNotFound());
    }
}
