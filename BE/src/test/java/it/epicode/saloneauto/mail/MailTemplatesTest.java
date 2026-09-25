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
                "<img src=x onerror=alert(1)>",
                "Auto \"speciale\" & <i>rara</i>",
                new BigDecimal("15000.00"), new BigDecimal("16000.00"),
                "https://fe.it/auto/1\" onclick=\"x",
                "https://fe.it/avvisi/disattiva?token=abc&x=<y>");

        assertThat(html)
                .doesNotContain("<img", "<i>", "onclick=\"x", "<y>")
                .contains("&lt;img src=x onerror=alert(1)&gt;")
                .contains("Auto &quot;speciale&quot; &amp; &lt;i&gt;rara&lt;/i&gt;")
                .contains("href=\"https://fe.it/auto/1&quot; onclick=&quot;x\"")
                .contains("token=abc&amp;x=&lt;y&gt;");
    }

    @Test
    void avvisoPrezzo_prezziInFormatoItaliano() {
        String html = mailTemplates.avvisoPrezzo("Anna", "Fiat Panda",
                new BigDecimal("15000.00"), new BigDecimal("16000.50"), "https://fe.it/a", "https://fe.it/d");

        // Prima di € Java mette uno spazio non separabile (U+00A0), che \s non riconosce
        assertThat(html).containsPattern("15\\.000,00[\\s\\u00A0]€").containsPattern("16\\.000,50[\\s\\u00A0]€");
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
