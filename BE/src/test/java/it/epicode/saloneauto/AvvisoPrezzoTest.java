package it.epicode.saloneauto;

import jakarta.mail.BodyPart;
import jakarta.mail.MessagingException;
import jakarta.mail.Multipart;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AvvisoPrezzoTest extends IntegrationTestBase {

    private static final Pattern TOKEN = Pattern.compile("token=([A-Za-z0-9_-]+)");

    @Test
    void prezzoSottoSoglia_inviaUnaMail_conNomeEscapato_eLinkMonouso() throws Exception {
        String email = emailUnica();
        String utente = nuovoUtente("<script>alert('x')</script>", email);
        long autoId = creaAuto("Tipo <b>1.4</b>", "20000", "PUBBLICATO");
        aggiungiPreferito(utente, autoId);
        long avvisoId = creaAvviso(utente, autoId, "18000");

        // Calo che resta sopra soglia: nessuna mail
        cambiaPrezzo(autoId, "19000");
        verify(mailSender, after(1000).never()).send(any(MimeMessage.class));

        // Attraversamento della soglia: una mail
        cambiaPrezzo(autoId, "17000");
        ArgumentCaptor<MimeMessage> captor = ArgumentCaptor.forClass(MimeMessage.class);
        verify(mailSender, timeout(5000)).send(captor.capture());
        MimeMessage mail = captor.getValue();
        String html = (String) mail.getContent();

        assertThat(mail.getAllRecipients()[0].toString()).isEqualTo(email);
        assertThat(html)
                .doesNotContain("<script>", "<b>1.4</b>")
                .contains("&lt;script&gt;alert(&#39;x&#39;)&lt;/script&gt;", "&lt;b&gt;1.4&lt;/b&gt;")
                .contains("http://localhost:5173/avvisi/disattiva?token=")
                .doesNotContain("avvisi/" + avvisoId);

        // Un ulteriore calo mentre è già sotto soglia non manda altre mail
        cambiaPrezzo(autoId, "16000");
        verify(mailSender, after(1000).times(1)).send(any(MimeMessage.class));

        mockMvc.perform(conToken(get("/api/avvisi/" + avvisoId), utente))
                .andExpect(jsonPath("$.ultimaNotifica").isNotEmpty());

        // L'id dell'avviso al posto del token non funziona
        disattiva(String.valueOf(avvisoId)).andExpect(status().isNotFound());

        // Il token funziona una sola volta
        Matcher m = TOKEN.matcher(html);
        assertThat(m.find()).isTrue();
        String token = m.group(1);
        disattiva(token).andExpect(status().isOk());
        disattiva(token).andExpect(status().isNotFound());

        mockMvc.perform(conToken(get("/api/avvisi/" + avvisoId), utente))
                .andExpect(jsonPath("$.attivo").value(false));
    }

    @Test
    void mailConFoto_allegaLaCopertinaInline_eMostraPrezzoVecchioENuovo() throws Exception {
        String utente = nuovoUtente();
        long autoId = creaAuto("Clio", "20000", "PUBBLICATO");
        byte[] png = {(byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A, 0, 0, 0, 0};
        mockMvc.perform(conToken(multipart("/api/admin/auto/" + autoId + "/immagini")
                        .file(new MockMultipartFile("files", "foto.png", "image/png", png)), admin()))
                .andExpect(status().isOk());
        aggiungiPreferito(utente, autoId);
        creaAvviso(utente, autoId, "18000");

        cambiaPrezzo(autoId, "17500");
        ArgumentCaptor<MimeMessage> captor = ArgumentCaptor.forClass(MimeMessage.class);
        verify(mailSender, timeout(5000)).send(captor.capture());
        MimeMessage mail = captor.getValue();
        // Il mock non invia: saveChanges (fatto dal vero invio SMTP) scrive i Content-Type delle parti
        mail.saveChanges();

        List<BodyPart> parti = new ArrayList<>();
        raccogliParti((Multipart) mail.getContent(), parti);
        BodyPart html = parti.stream().filter(p -> tipo(p, "text/html")).findFirst().orElseThrow();
        BodyPart foto = parti.stream().filter(p -> tipo(p, "image/png")).findFirst().orElseThrow();

        assertThat(foto.getHeader("Content-ID")).containsExactly("<foto-auto>");
        assertThat(foto.getInputStream().readAllBytes()).isEqualTo(png);
        assertThat((String) html.getContent())
                .contains("src=\"cid:foto-auto\"")
                .containsPattern("line-through;\">20\\.000,00[\\s\\u00A0]€")
                .containsPattern(">17\\.500,00[\\s\\u00A0]€")
                .containsPattern("Risparmi <span>2\\.500,00[\\s\\u00A0]€");
    }

    private static void raccogliParti(Multipart multipart, List<BodyPart> parti) throws Exception {
        for (int i = 0; i < multipart.getCount(); i++) {
            BodyPart parte = multipart.getBodyPart(i);
            if (parte.getContent() instanceof Multipart annidato) {
                raccogliParti(annidato, parti);
            } else {
                parti.add(parte);
            }
        }
    }

    private static boolean tipo(BodyPart parte, String mime) {
        try {
            return parte.isMimeType(mime);
        } catch (MessagingException e) {
            throw new IllegalStateException(e);
        }
    }

    @Test
    void avvisoDisattivato_nonRiceveMail() throws Exception {
        String utente = nuovoUtente();
        long autoId = creaAuto("Yaris", "15000", "PUBBLICATO");
        aggiungiPreferito(utente, autoId);
        long avvisoId = creaAvviso(utente, autoId, "14000");

        mockMvc.perform(conToken(put("/api/avvisi/" + avvisoId), utente).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"soglia\":14000,\"attivo\":false}"))
                .andExpect(status().isOk());
        cambiaPrezzo(autoId, "13000");
        verify(mailSender, after(1000).never()).send(any(MimeMessage.class));
    }

    @Test
    void avvisoRichiedeIlPreferito_eSogliaNonSopraIlPrezzo() throws Exception {
        String utente = nuovoUtente();
        long autoId = creaAuto("Ibiza", "12000", "PUBBLICATO");

        mockMvc.perform(conToken(post("/api/avvisi"), utente).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"autoId\":" + autoId + ",\"soglia\":11000}"))
                .andExpect(status().isBadRequest());

        aggiungiPreferito(utente, autoId);
        mockMvc.perform(conToken(post("/api/avvisi"), utente).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"autoId\":" + autoId + ",\"soglia\":13000}"))
                .andExpect(status().isBadRequest());

        long avvisoId = creaAvviso(utente, autoId, "11000");
        mockMvc.perform(conToken(post("/api/avvisi"), utente).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"autoId\":" + autoId + ",\"soglia\":10000}"))
                .andExpect(status().isConflict());

        // Rimuovere il preferito elimina anche l'avviso
        long preferitoId = ((Number) com.jayway.jsonpath.JsonPath.read(
                mockMvc.perform(conToken(get("/api/preferiti"), utente)).andReturn().getResponse().getContentAsString(),
                "$[0].id")).longValue();
        mockMvc.perform(conToken(delete("/api/preferiti/" + preferitoId), utente))
                .andExpect(status().isNoContent());
        mockMvc.perform(conToken(get("/api/avvisi/" + avvisoId), utente)).andExpect(status().isNotFound());
    }

    @Test
    void prezzoScesoInBozza_ripubblicazione_inviaUnaMail() throws Exception {
        String utente = nuovoUtente();
        long autoId = creaAuto("Golf", "20000", "PUBBLICATO");
        aggiungiPreferito(utente, autoId);
        creaAvviso(utente, autoId, "18000");

        // In bozza il pubblico non vede il ribasso: nessuna mail
        cambiaStato(autoId, "BOZZA");
        cambiaPrezzo(autoId, "15000");
        verify(mailSender, after(1000).never()).send(any(MimeMessage.class));

        // Alla ripubblicazione si confronta con l'ultimo prezzo pubblico (20000)
        cambiaStato(autoId, "PUBBLICATO");
        verify(mailSender, timeout(5000)).send(any(MimeMessage.class));
        verify(mailSender, after(1000).times(1)).send(any(MimeMessage.class));
    }

    @Test
    void prezzoScesoInBozza_ripubblicazioneConPut_inviaUnaSolaMail() throws Exception {
        String utente = nuovoUtente();
        long autoId = creaAuto("Polo", "20000", "PUBBLICATO");
        aggiungiPreferito(utente, autoId);
        creaAvviso(utente, autoId, "18000");

        cambiaStato(autoId, "BOZZA");
        cambiaPrezzo(autoId, "17000");

        // Stato e prezzo nello stesso PUT: un solo confronto, 20000 → 16000
        mockMvc.perform(conToken(put("/api/admin/auto/" + autoId), admin())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(autoJson("Polo", "16000", "PUBBLICATO")))
                .andExpect(status().isOk());
        verify(mailSender, timeout(5000)).send(any(MimeMessage.class));
        verify(mailSender, after(1000).times(1)).send(any(MimeMessage.class));
    }

    @Test
    void avvisoDiAnnuncioInBozza_nascostoInLetturaEModifica_maEliminabile() throws Exception {
        String utente = nuovoUtente();
        long autoId = creaAuto("Panda", "12000", "PUBBLICATO");
        aggiungiPreferito(utente, autoId);
        long avvisoId = creaAvviso(utente, autoId, "11000");

        cambiaStato(autoId, "BOZZA");

        mockMvc.perform(conToken(get("/api/avvisi"), utente)).andExpect(jsonPath("$.length()").value(0));
        mockMvc.perform(conToken(get("/api/avvisi/" + avvisoId), utente)).andExpect(status().isNotFound());
        mockMvc.perform(conToken(put("/api/avvisi/" + avvisoId), utente).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"soglia\":10000,\"attivo\":true}"))
                .andExpect(status().isNotFound());

        // Tornato pubblicato, l'avviso ricompare invariato
        cambiaStato(autoId, "PUBBLICATO");
        mockMvc.perform(conToken(get("/api/avvisi/" + avvisoId), utente))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.soglia").value(11000));

        cambiaStato(autoId, "BOZZA");
        mockMvc.perform(conToken(delete("/api/avvisi/" + avvisoId), utente)).andExpect(status().isNoContent());
    }

    private void cambiaStato(long autoId, String stato) throws Exception {
        mockMvc.perform(conToken(patch("/api/admin/auto/" + autoId + "/stato"), admin())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"statoAnnuncio\":\"" + stato + "\"}"))
                .andExpect(status().isOk());
    }

    private org.springframework.test.web.servlet.ResultActions disattiva(String token) throws Exception {
        return mockMvc.perform(post("/api/avvisi/disattiva").contentType(MediaType.APPLICATION_JSON)
                .content("{\"token\":" + jsonString(token) + "}"));
    }
}
