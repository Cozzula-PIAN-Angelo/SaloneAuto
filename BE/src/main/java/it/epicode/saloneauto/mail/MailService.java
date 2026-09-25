package it.epicode.saloneauto.mail;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailSendException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class MailService {

    private final JavaMailSender mailSender;
    private final String mittente;

    public MailService(JavaMailSender mailSender,
                       @Value("${app.mail.from:}") String mittente,
                       @Value("${spring.mail.username:}") String utenteSmtp) {
        this.mailSender = mailSender;
        this.mittente = mittente.isBlank() ? utenteSmtp : mittente;
    }

    public void inviaHtml(String destinatario, String oggetto, String html) {
        try {
            MimeMessage messaggio = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(messaggio, false, "UTF-8");
            helper.setFrom(mittente);
            helper.setTo(destinatario);
            // Niente a capo nell'oggetto: impedisce di iniettare header aggiuntivi
            helper.setSubject(oggetto.replaceAll("[\\r\\n]+", " "));
            helper.setText(html, true);
            mailSender.send(messaggio);
        } catch (MessagingException e) {
            throw new MailSendException("Composizione della mail fallita", e);
        }
    }
}
