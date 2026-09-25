package it.epicode.saloneauto.payloads;

import java.time.Instant;
import java.util.List;

public record ErroreResponse(Instant timestamp, int status, String messaggio, List<String> errori) {

    public static ErroreResponse di(int status, String messaggio) {
        return new ErroreResponse(Instant.now(), status, messaggio, List.of());
    }
}
