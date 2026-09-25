package it.epicode.saloneauto.mail;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.thymeleaf.ITemplateEngine;
import org.thymeleaf.context.Context;

import java.math.BigDecimal;
import java.util.Locale;

/**
 * Corpo HTML delle mail, generato con Thymeleaf dai template in templates/mail/.
 * I template usano solo th:text e th:href, che fanno l'escape di ogni valore:
 * nome utente e titolo dell'auto arrivano nella mail come testo, mai come markup.
 */
@Component
@RequiredArgsConstructor
public class MailTemplates {

    // Locale italiano: #numbers.formatCurrency produce "15.000,00 €"
    private static final Locale LOCALE = Locale.ITALY;

    private final ITemplateEngine templateEngine;

    public String avvisoPrezzo(String nome, String titoloAuto, BigDecimal prezzo, BigDecimal soglia,
                               String linkAnnuncio, String linkDisattiva) {
        Context ctx = new Context(LOCALE);
        ctx.setVariable("nome", nome);
        ctx.setVariable("titoloAuto", titoloAuto);
        ctx.setVariable("prezzo", prezzo);
        ctx.setVariable("soglia", soglia);
        ctx.setVariable("linkAnnuncio", linkAnnuncio);
        ctx.setVariable("linkDisattiva", linkDisattiva);
        return templateEngine.process("mail/avviso-prezzo", ctx);
    }

    public String resetPassword(String nome, String linkReset, long minutiValidita) {
        Context ctx = new Context(LOCALE);
        ctx.setVariable("nome", nome);
        ctx.setVariable("linkReset", linkReset);
        ctx.setVariable("minutiValidita", minutiValidita);
        return templateEngine.process("mail/reset-password", ctx);
    }
}
