package it.epicode.saloneauto.mail;

import org.junit.jupiter.api.Test;
import org.thymeleaf.spring6.SpringTemplateEngine;
import org.thymeleaf.templatemode.TemplateMode;
import org.thymeleaf.templateresolver.ClassLoaderTemplateResolver;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

/** I template Thymeleaf reali, con un motore configurato come quello di Spring Boot. */
class MailTemplatesTest {

    private final MailTemplates mailTemplates = new MailTemplates(motore());

    private static SpringTemplateEngine motore() {
        ClassLoaderTemplateResolver resolver = new ClassLoaderTemplateResolver();
        resolver.setPrefix("templates/");
        resolver.setSuffix(".html");
        resolver.setTemplateMode(TemplateMode.HTML);
        resolver.setCharacterEncoding("UTF-8");
        SpringTemplateEngine engine = new SpringTemplateEngine();
        engine.setTemplateResolver(resolver);
        return engine;
    }

    @Test
    void avvisoPrezzo_ogniValoreVieneEscapato() {
        String html = mailTemplates.avvisoPrezzo(
                "<svg onload=alert(1)>",
                "Auto \"speciale\" & <i>rara</i>",
                new BigDecimal("17000.00"), new BigDecimal("15000.00"), new BigDecimal("16000.00"), "foto\" onerror=\"x",
                "https://fe.it/auto/1\" onclick=\"x",
                "https://fe.it/avvisi/disattiva?token=abc&x=<y>");

        assertThat(html)
                .doesNotContain("<svg", "<i>", "onclick=\"x", "onerror=\"x", "<y>")
                .contains("&lt;svg onload=alert(1)&gt;")
                .contains("src=\"cid:foto&quot; onerror=&quot;x\"")
                .contains("Auto &quot;speciale&quot; &amp; &lt;i&gt;rara&lt;/i&gt;")
                .contains("href=\"https://fe.it/auto/1&quot; onclick=&quot;x\"")
                .contains("token=abc&amp;x=&lt;y&gt;");
    }

    @Test
    void avvisoPrezzo_prezzoVecchioNuovoERisparmio_inFormatoItaliano() {
        String html = mailTemplates.avvisoPrezzo("Anna", "Fiat Panda", new BigDecimal("18500.00"),
                new BigDecimal("15000.00"), new BigDecimal("16000.50"), null, "https://fe.it/a", "https://fe.it/d");

        // Prima di € Java mette uno spazio non separabile (U+00A0), che \s non riconosce
        assertThat(html)
                .containsPattern("line-through;\">18\\.500,00[\\s\\u00A0]€")
                .containsPattern(">15\\.000,00[\\s\\u00A0]€")
                .containsPattern("Risparmi <span>3\\.500,00[\\s\\u00A0]€")
                .containsPattern("16\\.000,50[\\s\\u00A0]€");
    }

    @Test
    void avvisoPrezzo_fotoInlineSoloSePresente() {
        String conFoto = mailTemplates.avvisoPrezzo("Anna", "Fiat Panda", new BigDecimal("2"), new BigDecimal("1"),
                new BigDecimal("1"), "foto-auto", "https://fe.it/a", "https://fe.it/d");
        String senzaFoto = mailTemplates.avvisoPrezzo("Anna", "Fiat Panda", new BigDecimal("2"), new BigDecimal("1"),
                new BigDecimal("1"), null, "https://fe.it/a", "https://fe.it/d");

        assertThat(conFoto).contains("src=\"cid:foto-auto\"", "alt=\"Fiat Panda\"");
        assertThat(senzaFoto).doesNotContain("<img", "cid:");
    }

    @Test
    void resetPassword_escapaNome_eMostraLink() {
        String html = mailTemplates.resetPassword("</p><script>x</script>", "https://fe.it/reset?token=a", 30);

        assertThat(html)
                .doesNotContain("<script>")
                .contains("&lt;/p&gt;&lt;script&gt;x&lt;/script&gt;")
                .contains("href=\"https://fe.it/reset?token=a\"")
                .contains(">30<");
    }
}
