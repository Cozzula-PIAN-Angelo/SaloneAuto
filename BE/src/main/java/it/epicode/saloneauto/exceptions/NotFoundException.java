package it.epicode.saloneauto.exceptions;

public class NotFoundException extends RuntimeException {

    public NotFoundException(String messaggio) {
        super(messaggio);
    }
}
