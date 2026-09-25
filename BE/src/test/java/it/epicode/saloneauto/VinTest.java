package it.epicode.saloneauto;

import it.epicode.saloneauto.exceptions.NotFoundException;
import it.epicode.saloneauto.exceptions.ServizioEsternoException;
import it.epicode.saloneauto.services.autodev.AutoDevVin;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import java.util.UUID;

import static org.hamcrest.Matchers.contains;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class VinTest extends IntegrationTestBase {

    private static final String VIN = "WVWZZZ1KZAW000001";

    private static AutoDevVin golf() {
        return new AutoDevVin(VIN, true, "Volkswagen", "Golf", "GTD", "5dr Hatchback", "Hatchback",
                "2.0L I4 Turbo Diesel", "FWD", "Manual", new AutoDevVin.Veicolo(2019, "Volkswagen", "Golf", "VW AG"),
                false);
    }

    @Test
    void decodificaVin_precompilaIDati_eUsaLaCache() throws Exception {
        when(autoDevClient.decodificaVin(VIN)).thenReturn(golf());

        // Minuscolo in ingresso: viene normalizzato prima della chiamata
        mockMvc.perform(conToken(get("/api/admin/vin/" + VIN.toLowerCase()), admin()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.vin").value(VIN))
                .andExpect(jsonPath("$.marca").value("Volkswagen"))
                .andExpect(jsonPath("$.modello").value("Golf"))
                .andExpect(jsonPath("$.anno").value(2019))
                .andExpect(jsonPath("$.allestimento").value("GTD"))
                .andExpect(jsonPath("$.carburanteSuggerito").value("DIESEL"))
                .andExpect(jsonPath("$.titoloSuggerito").value("Volkswagen Golf GTD"));

        mockMvc.perform(conToken(get("/api/admin/vin/" + VIN), admin())).andExpect(status().isOk());
        verify(autoDevClient, times(1)).decodificaVin(VIN);
    }

    @Test
    void decodificaVin_soloAdmin() throws Exception {
        mockMvc.perform(get("/api/admin/vin/" + VIN)).andExpect(status().isUnauthorized());
        mockMvc.perform(conToken(get("/api/admin/vin/" + VIN), nuovoUtente())).andExpect(status().isForbidden());
        verifyNoInteractions(autoDevClient);
    }

    @Test
    void vinMalformato_400_senzaChiamareAutoDev() throws Exception {
        String admin = admin();
        for (String vin : new String[]{"123", "WVWZZZ1KZAW00000I", "WVWZZZ1KZAW000001X", "WVWZZZ1KZ%2F000001"}) {
            mockMvc.perform(conToken(get("/api/admin/vin/" + vin), admin)).andExpect(status().isBadRequest());
        }
        verify(autoDevClient, never()).decodificaVin(anyString());
    }

    @Test
    void erroriDiAutoDev_tradottiInRisposteCoerenti() throws Exception {
        String vinSconosciuto = "1HGCM82633A004352";
        String vinGuasto = "JH4KA7561PC008269";
        when(autoDevClient.decodificaVin(vinSconosciuto)).thenThrow(new NotFoundException("Nessun dato trovato per questo VIN"));
        when(autoDevClient.decodificaVin(vinGuasto)).thenThrow(new ServizioEsternoException("Servizio non disponibile"));

        mockMvc.perform(conToken(get("/api/admin/vin/" + vinSconosciuto), admin())).andExpect(status().isNotFound());
        mockMvc.perform(conToken(get("/api/admin/vin/" + vinGuasto), admin()))
                .andExpect(status().isBadGateway())
                .andExpect(jsonPath("$.status").value(502));
    }

    // ===== Nuovi campi dell'annuncio =====

    @Test
    void filtriPerMarcaEAnno_eOrdinamentoPerAnno() throws Exception {
        String marca = "Marca" + UUID.randomUUID().toString().substring(0, 6);
        creaAuto(marca, "Alfa", 2015, null);
        creaAuto(marca, "Beta", 2021, null);
        creaAuto(marca, "Gamma", 2018, null);

        mockMvc.perform(get("/api/auto").param("marca", marca.toUpperCase())
                        .param("ordinaPer", "anno").param("direzione", "asc"))
                .andExpect(jsonPath("$.contenuto[*].anno", contains(2015, 2018, 2021)));
        mockMvc.perform(get("/api/auto").param("marca", marca).param("annoMin", "2017").param("modello", "beta"))
                .andExpect(jsonPath("$.contenuto[*].modello", contains("Beta")));
        mockMvc.perform(get("/api/auto").param("annoMin", "duemila")).andExpect(status().isBadRequest());
    }

    @Test
    void vinDuplicatoOMalformatoNellAnnuncio() throws Exception {
        String vin = ("ZFA" + UUID.randomUUID().toString().replaceAll("[^0-9]", "") + "00000000000000").substring(0, 17);
        creaAuto("Fiat", "Panda", 2020, vin.toLowerCase());

        mockMvc.perform(conToken(post("/api/admin/auto"), admin()).contentType(MediaType.APPLICATION_JSON)
                        .content(json("Fiat", "Panda", 2020, vin)))
                .andExpect(status().isConflict());
        mockMvc.perform(conToken(post("/api/admin/auto"), admin()).contentType(MediaType.APPLICATION_JSON)
                        .content(json("Fiat", "Panda", 2020, "NONVALIDO")))
                .andExpect(status().isBadRequest());
        mockMvc.perform(conToken(post("/api/admin/auto"), admin()).contentType(MediaType.APPLICATION_JSON)
                        .content(json("Fiat", "Panda", 2099, null)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void vinVuotoDalForm_valeComeNonIndicato() throws Exception {
        // Due annunci con VIN "" non vanno in conflitto: vengono salvati entrambi senza VIN
        for (String vin : new String[]{"", "   "}) {
            mockMvc.perform(conToken(post("/api/admin/auto"), admin()).contentType(MediaType.APPLICATION_JSON)
                            .content(json("Fiat", "Punto", 2019, vin)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.vin").isEmpty());
        }
    }

    private void creaAuto(String marca, String modello, int anno, String vin) throws Exception {
        mockMvc.perform(conToken(post("/api/admin/auto"), admin()).contentType(MediaType.APPLICATION_JSON)
                        .content(json(marca, modello, anno, vin)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.vin").value(vin == null ? null : vin.toUpperCase()));
    }

    private static String json(String marca, String modello, int anno, String vin) {
        return "{\"titolo\":\"" + marca + " " + modello + "\",\"marca\":\"" + marca + "\",\"modello\":\"" + modello
                + "\",\"anno\":" + anno + ",\"vin\":" + (vin == null ? "null" : "\"" + vin + "\"")
                + ",\"descrizione\":\"Descrizione\",\"chilometraggio\":1000,\"carburante\":\"BENZINA\","
                + "\"condizione\":\"USATO\",\"prezzo\":10000,\"statoAnnuncio\":\"PUBBLICATO\"}";
    }
}
