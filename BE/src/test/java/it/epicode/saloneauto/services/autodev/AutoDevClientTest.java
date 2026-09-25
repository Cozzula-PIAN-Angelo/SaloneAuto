package it.epicode.saloneauto.services.autodev;

import it.epicode.saloneauto.exceptions.NotFoundException;
import it.epicode.saloneauto.exceptions.ServizioEsternoException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.*;
import static org.springframework.test.web.client.response.MockRestResponseCreators.*;

/** Il client HTTP verso Auto.dev, con il server simulato da MockRestServiceServer. */
class AutoDevClientTest {

    private static final String VIN = "3GCUDHEL3NG668790";

    private MockRestServiceServer server;
    private AutoDevClient client;

    @BeforeEach
    void setUp() {
        RestClient.Builder builder = RestClient.builder();
        server = MockRestServiceServer.bindTo(builder).build();
        client = new AutoDevClient(builder, "https://api.auto.dev", "chiave-segreta");
    }

    @Test
    void chiamaIlPathGiusto_conLaChiaveNellHeader_eLeggeLaRisposta() {
        // Esempio dalla documentazione di Auto.dev, con un campo in più che va ignorato
        String json = """
                {"vin":"3GCUDHEL3NG668790","vinValid":true,"wmi":"3GC","origin":"Mexico",
                 "make":"Chevrolet","model":"Silverado 1500","trim":"ZR2","style":"4x4 4dr Crew Cab 5.8 ft. SB",
                 "body":"Truck","engine":"5.3L V8 OHV 16V FFV","drive":"4WD","transmission":"Automatic",
                 "vehicle":{"vin":"3GCUDHEL3NG668790","year":2022,"make":"Chevrolet","model":"Silverado 1500",
                 "manufacturer":"General Motors de Mexico"},"ambiguous":false,"campoNuovo":123}
                """;
        // requestTo confronta l'URI intero: una chiave in query string (?apiKey=...) farebbe fallire il test
        server.expect(requestTo("https://api.auto.dev/vin/" + VIN))
                .andExpect(header("Authorization", "Bearer chiave-segreta"))
                .andRespond(withSuccess(json, MediaType.APPLICATION_JSON));

        AutoDevVin risposta = client.decodificaVin(VIN);

        assertThat(risposta.make()).isEqualTo("Chevrolet");
        assertThat(risposta.trim()).isEqualTo("ZR2");
        assertThat(risposta.vehicle().year()).isEqualTo(2022);
        server.verify();
    }

    @Test
    void vinNonTrovato_diventaNotFound() {
        server.expect(requestTo("https://api.auto.dev/vin/" + VIN))
                .andRespond(withStatus(HttpStatus.NOT_FOUND).contentType(MediaType.APPLICATION_JSON)
                        .body("{\"status\":404,\"code\":\"VIN_NOT_FOUND\"}"));

        assertThatThrownBy(() -> client.decodificaVin(VIN)).isInstanceOf(NotFoundException.class);
    }

    @Test
    void chiaveErrata_quotaEsaurita_erroreServer_diventanoServizioEsterno() {
        for (HttpStatus status : new HttpStatus[]{HttpStatus.UNAUTHORIZED, HttpStatus.TOO_MANY_REQUESTS,
                HttpStatus.INTERNAL_SERVER_ERROR}) {
            server.reset();
            server.expect(requestTo("https://api.auto.dev/vin/" + VIN)).andRespond(withStatus(status));
            assertThatThrownBy(() -> client.decodificaVin(VIN))
                    .isInstanceOf(ServizioEsternoException.class)
                    .hasMessageNotContaining("chiave-segreta");
        }
    }

    @Test
    void rispostaIlleggibile_diventaServizioEsterno() {
        server.expect(requestTo("https://api.auto.dev/vin/" + VIN))
                .andRespond(withSuccess("<html>non json</html>", MediaType.APPLICATION_JSON));

        assertThatThrownBy(() -> client.decodificaVin(VIN)).isInstanceOf(ServizioEsternoException.class);
    }

    @Test
    void senzaChiave_nessunaChiamata() {
        RestClient.Builder builder = RestClient.builder();
        MockRestServiceServer nessunaChiamata = MockRestServiceServer.bindTo(builder).build();
        AutoDevClient nonConfigurato = new AutoDevClient(builder, "https://api.auto.dev", "");

        assertThatThrownBy(() -> nonConfigurato.decodificaVin(VIN)).isInstanceOf(ServizioEsternoException.class);
        nessunaChiamata.verify();
    }
}
