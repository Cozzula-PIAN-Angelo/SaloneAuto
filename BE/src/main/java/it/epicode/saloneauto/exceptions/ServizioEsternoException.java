package it.epicode.saloneauto.exceptions;

/** Un servizio esterno (es. Auto.dev) non è configurato, non risponde o risponde con un errore. */
public class ServizioEsternoException extends RuntimeException {

    public ServizioEsternoException(String messaggio) {
        super(messaggio);
    }
}
