package it.epicode.saloneauto.services;

import it.epicode.saloneauto.events.PrezzoScesoEvent;
import it.epicode.saloneauto.events.ResetPasswordRichiestoEvent;
import it.epicode.saloneauto.mail.MailService;
import it.epicode.saloneauto.mail.MailTemplates;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionalEventListener;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

/**
 * Le mail partono solo dopo il commit (se la transazione fallisce non si notifica niente)
 * e su un thread separato, così la risposta HTTP non aspetta l'SMTP.
 * Nei log finiscono solo id, mai indirizzi email.
 */
@Component
@Slf4j
public class NotificheListener {

    private final AvvisoService avvisoService;
    private final MailService mailService;
    private final MailTemplates mailTemplates;
    private final String frontendUrl;

    public NotificheListener(AvvisoService avvisoService, MailService mailService, MailTemplates mailTemplates,
                             @Value("${app.frontend-url}") String frontendUrl) {
        this.avvisoService = avvisoService;
        this.mailService = mailService;
        this.mailTemplates = mailTemplates;
        this.frontendUrl = frontendUrl;
    }

    @Async
    @TransactionalEventListener
    public void prezzoSceso(PrezzoScesoEvent evento) {
        var notifiche = avvisoService.preparaNotifiche(evento.autoId(), evento.prezzoVecchio(), evento.prezzoNuovo());
        for (var n : notifiche) {
            try {
                String html = mailTemplates.avvisoPrezzo(n.nome(), n.titoloAuto(), n.prezzo(), n.soglia(),
                        frontendUrl + "/auto/" + n.autoId(),
                        frontendUrl + "/avvisi/disattiva?token=" + URLEncoder.encode(n.tokenDisattivazione(), StandardCharsets.UTF_8));
                mailService.inviaHtml(n.email(), "Il prezzo di " + n.titoloAuto() + " è sceso", html);
                log.info("Avviso prezzo inviato (avviso id={})", n.avvisoId());
            } catch (RuntimeException e) {
                log.warn("Invio avviso prezzo fallito (avviso id={}, {})", n.avvisoId(), e.getClass().getSimpleName());
            }
        }
    }

    @Async
    @TransactionalEventListener
    public void resetPasswordRichiesto(ResetPasswordRichiestoEvent evento) {
        try {
            String html = mailTemplates.resetPassword(evento.nome(),
                    frontendUrl + "/reset-password?token=" + URLEncoder.encode(evento.token(), StandardCharsets.UTF_8),
                    AuthService.MINUTI_VALIDITA_RESET);
            mailService.inviaHtml(evento.email(), "Reimposta la tua password", html);
            log.info("Mail di reset password inviata (utente id={})", evento.utenteId());
        } catch (RuntimeException e) {
            log.warn("Invio mail di reset fallito (utente id={}, {})", evento.utenteId(), e.getClass().getSimpleName());
        }
    }
}
