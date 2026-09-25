package it.epicode.saloneauto.events;

public record ResetPasswordRichiestoEvent(Long utenteId, String nome, String email, String token) {

    // Email e token non devono finire nei log se l'evento viene stampato
    @Override
    public String toString() {
        return "ResetPasswordRichiestoEvent[utenteId=" + utenteId + "]";
    }
}
