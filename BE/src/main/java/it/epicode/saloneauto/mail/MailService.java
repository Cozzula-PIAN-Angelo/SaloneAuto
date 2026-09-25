package it.epicode.saloneauto.mail;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.InputStreamSource;
import org.springframework.mail.MailSendException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MailService {

    /** Immagine allegata alla mail e richiamata nell'HTML con src="cid:{contentId}". */
    public record ImmagineInline(String contentId, InputStreamSource contenuto, String contentType) {
    }

    private final JavaMailSender mailSender;
    private final String mittente;

    public MailService(JavaMailSender mailSender,
                       @Value("${app.mail.from:}") String mittente,
                       @Value("${spring.mail.username:}") String utenteSmtp) {
        this.mailSender = mailSender;
        this.mittente = mittente.isBlank() ? utenteSmtp : mittente;
    }

    public void inviaHtml(String destinatario, String oggetto, String html) {
        inviaHtml(destinatario, oggetto, html, List.of());
    }

    public void inviaHtml(String destinatario, String oggetto, String html, List<ImmagineInline> immagini) {
        try {
            MimeMessage messaggio = mailSender.createMimeMessage();
            // Multipart solo se ci sono immagini: altrimenti la mail resta un semplice text/html
            MimeMessageHelper helper = new MimeMessageHelper(messaggio, !immagini.isEmpty(), "UTF-8");
            helper.setFrom(mittente);
            helper.setTo(destinatario);
            // Niente a capo nell'oggetto: impedisce di iniettare header aggiuntivi
            helper.setSubject(oggetto.replaceAll("[\\r\\n]+", " "));
            // setText va chiamato prima di addInline
            helper.setText(html, true);
            for (ImmagineInline immagine : immagini) {
                helper.addInline(immagine.contentId(), immagine.contenuto(), immagine.contentType());
            }
            mailSender.send(messaggio);
        } catch (MessagingException e) {
            throw new MailSendException("Composizione della mail fallita", e);
        }
    }
}
