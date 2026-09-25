package it.epicode.saloneauto.exceptions;

public class TroppiTentativiException extends RuntimeException {

    public TroppiTentativiException() {
        super("Troppi tentativi, riprova più tardi");
    }
}
