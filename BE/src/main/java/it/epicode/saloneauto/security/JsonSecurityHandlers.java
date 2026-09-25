package it.epicode.saloneauto.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.Instant;

/**
 * 401 e 403 prodotti dalla catena di filtri, con lo stesso formato di GlobalExceptionHandler.
 * I messaggi sono costanti, quindi il JSON si può comporre a mano senza rischi di injection.
 */
@Component
public class JsonSecurityHandlers implements AuthenticationEntryPoint, AccessDeniedHandler {

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response,
                         AuthenticationException ex) throws IOException {
        scrivi(response, 401, "Autenticazione richiesta");
    }

    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response,
                       AccessDeniedException ex) throws IOException {
        scrivi(response, 403, "Non hai i permessi per questa operazione");
    }

    private void scrivi(HttpServletResponse response, int status, String messaggio) throws IOException {
        response.setStatus(status);
        response.setContentType("application/json;charset=UTF-8");
        response.getWriter().write("{\"timestamp\":\"" + Instant.now() + "\",\"status\":" + status
                + ",\"messaggio\":\"" + messaggio + "\",\"errori\":[]}");
    }
}
