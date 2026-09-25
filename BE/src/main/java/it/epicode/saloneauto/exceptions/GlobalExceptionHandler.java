package it.epicode.saloneauto.exceptions;

import it.epicode.saloneauto.payloads.ErroreResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.validation.BindException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.MultipartException;
import org.springframework.web.multipart.support.MissingServletRequestPartException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.time.Instant;
import java.util.List;

/**
 * Unico punto di traduzione eccezioni → HTTP. I messaggi restituiti non riportano mai
 * i valori inviati dal client, e nei log non finiscono body, email o password.
 */
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<ErroreResponse> notFound(NotFoundException ex) {
        return risposta(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<ErroreResponse> badRequest(BadRequestException ex) {
        return risposta(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

    @ExceptionHandler(ConflictException.class)
    public ResponseEntity<ErroreResponse> conflict(ConflictException ex) {
        return risposta(HttpStatus.CONFLICT, ex.getMessage());
    }

    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<ErroreResponse> unauthorized(UnauthorizedException ex) {
        return risposta(HttpStatus.UNAUTHORIZED, ex.getMessage());
    }

    @ExceptionHandler(TroppiTentativiException.class)
    public ResponseEntity<ErroreResponse> troppiTentativi(TroppiTentativiException ex) {
        return risposta(HttpStatus.TOO_MANY_REQUESTS, ex.getMessage());
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErroreResponse> accessDenied(AccessDeniedException ex) {
        return risposta(HttpStatus.FORBIDDEN, "Non hai i permessi per questa operazione");
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErroreResponse> validazione(MethodArgumentNotValidException ex) {
        List<String> errori = ex.getBindingResult().getFieldErrors().stream()
                .map(e -> e.getField() + ": " + e.getDefaultMessage())
                .toList();
        return ResponseEntity.badRequest()
                .body(new ErroreResponse(Instant.now(), 400, "Dati non validi", errori));
    }

    // Parametri della query string legati a un oggetto (es. FiltriRicerca con carburante=XYZ)
    @ExceptionHandler(BindException.class)
    public ResponseEntity<ErroreResponse> parametriNonValidi(BindException ex) {
        List<String> errori = ex.getFieldErrors().stream()
                .map(e -> e.getField() + ": valore non valido")
                .toList();
        return ResponseEntity.badRequest()
                .body(new ErroreResponse(Instant.now(), 400, "Parametri non validi", errori));
    }

    @ExceptionHandler(ServizioEsternoException.class)
    public ResponseEntity<ErroreResponse> servizioEsterno(ServizioEsternoException ex) {
        return risposta(HttpStatus.BAD_GATEWAY, ex.getMessage());
    }

    @ExceptionHandler(HandlerMethodValidationException.class)
    public ResponseEntity<ErroreResponse> validazioneParametri(HandlerMethodValidationException ex) {
        return risposta(HttpStatus.BAD_REQUEST, "Parametri non validi");
    }

    @ExceptionHandler({HttpMessageNotReadableException.class, MethodArgumentTypeMismatchException.class,
            MissingServletRequestParameterException.class, MissingServletRequestPartException.class,
            MultipartException.class})
    public ResponseEntity<ErroreResponse> richiestaMalformata(Exception ex) {
        if (ex instanceof MaxUploadSizeExceededException) {
            return risposta(HttpStatus.CONTENT_TOO_LARGE, "File troppo grande");
        }
        return risposta(HttpStatus.BAD_REQUEST, "Richiesta non valida");
    }

    // Vincoli unique violati in concorrenza (es. doppio click su "aggiungi ai preferiti").
    // Il messaggio del DB può contenere i valori (anche email): non va né restituito né loggato.
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErroreResponse> conflittoDati(DataIntegrityViolationException ex) {
        return risposta(HttpStatus.CONFLICT, "Risorsa già esistente o in conflitto");
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ErroreResponse> risorsaInesistente(NoResourceFoundException ex) {
        return risposta(HttpStatus.NOT_FOUND, "Risorsa non trovata");
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ErroreResponse> metodoNonSupportato(HttpRequestMethodNotSupportedException ex) {
        return risposta(HttpStatus.METHOD_NOT_ALLOWED, "Metodo non supportato");
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErroreResponse> generico(Exception ex) {
        // Tipo e punto di origine, senza il messaggio: potrebbe contenere dati personali
        StackTraceElement origine = ex.getStackTrace().length > 0 ? ex.getStackTrace()[0] : null;
        log.error("Errore non gestito: {} in {}", ex.getClass().getName(), origine);
        return risposta(HttpStatus.INTERNAL_SERVER_ERROR, "Errore interno del server");
    }

    private ResponseEntity<ErroreResponse> risposta(HttpStatus status, String messaggio) {
        return ResponseEntity.status(status).body(ErroreResponse.di(status.value(), messaggio));
    }
}
