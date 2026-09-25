package it.epicode.saloneauto.services.autodev;

import it.epicode.saloneauto.exceptions.BadRequestException;
import it.epicode.saloneauto.exceptions.NotFoundException;
import it.epicode.saloneauto.exceptions.ServizioEsternoException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

/**
 * Client HTTP verso Auto.dev (https://docs.auto.dev). La chiave API viaggia solo
 * nell'header Authorization (mai in query string, dove finirebbe nei log) ed esiste
 * solo lato server: il frontend non la vede mai.
 */
@Component
@Slf4j
public class AutoDevClient {

    private static final String NON_DISPONIBILE = "Servizio di decodifica VIN non disponibile, riprova più tardi";

    private final RestClient restClient;
    private final boolean configurato;

    public AutoDevClient(@Qualifier("autoDevRestClientBuilder") RestClient.Builder builder,
                         @Value("${app.autodev.base-url}") String baseUrl,
                         @Value("${app.autodev.api-key:}") String apiKey) {
        this.configurato = !apiKey.isBlank();
        this.restClient = builder
                .baseUrl(baseUrl)
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                .defaultHeader(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
                .build();
    }

    /** Il VIN deve essere già validato: qui viene solo inserito (codificato) nel path. */
    public AutoDevVin decodificaVin(String vin) {
        if (!configurato) {
            throw new ServizioEsternoException("Decodifica VIN non configurata (manca AUTODEV_API_KEY)");
        }
        AutoDevVin risposta;
        try {
            risposta = restClient.get()
                    .uri("/vin/{vin}", vin)
                    .retrieve()
                    .onStatus(s -> s.value() == 404, (req, res) -> {
                        throw new NotFoundException("Nessun dato trovato per questo VIN");
                    })
                    .onStatus(s -> s.value() == 400, (req, res) -> {
                        throw new BadRequestException("VIN non valido");
                    })
                    .onStatus(HttpStatusCode::isError, (req, res) -> {
                        // 401/403 = chiave errata, 429 = quota esaurita, 5xx = problema loro
                        log.warn("Auto.dev ha risposto con status {}", res.getStatusCode().value());
                        throw new ServizioEsternoException(NON_DISPONIBILE);
                    })
                    .body(AutoDevVin.class);
        } catch (RestClientException e) {
            // Timeout, connessione rifiutata, JSON illeggibile
            log.warn("Chiamata ad Auto.dev fallita ({})", e.getClass().getSimpleName());
            throw new ServizioEsternoException(NON_DISPONIBILE);
        }
        if (risposta == null) {
            throw new ServizioEsternoException(NON_DISPONIBILE);
        }
        return risposta;
    }
}
