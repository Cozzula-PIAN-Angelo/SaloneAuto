package it.epicode.saloneauto.security;

import it.epicode.saloneauto.exceptions.TroppiTentativiException;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class LimitatoreTentativiTest {

    private final OrologioManuale orologio = new OrologioManuale();
    private final LimitatoreTentativi limitatore = new LimitatoreTentativi(3, 2, 2, orologio);

    @Test
    void login_bloccatoDopoIFallimenti_eSbloccatoAFineFinestra() {
        for (int i = 0; i < 3; i++) {
            limitatore.verificaLogin("1.1.1.1", "a@b.it");
            limitatore.loginFallito("1.1.1.1", "a@b.it");
        }
        assertThatThrownBy(() -> limitatore.verificaLogin("1.1.1.1", "a@b.it"))
                .isInstanceOf(TroppiTentativiException.class);

        // Altro IP o altra email: conteggi separati
        assertThatCode(() -> limitatore.verificaLogin("2.2.2.2", "a@b.it")).doesNotThrowAnyException();
        assertThatCode(() -> limitatore.verificaLogin("1.1.1.1", "c@d.it")).doesNotThrowAnyException();

        orologio.avanza(LimitatoreTentativi.FINESTRA_LOGIN.plusSeconds(1));
        assertThatCode(() -> limitatore.verificaLogin("1.1.1.1", "a@b.it")).doesNotThrowAnyException();
    }

    @Test
    void login_riuscitoAzzeraIFallimenti() {
        limitatore.loginFallito("1.1.1.1", "a@b.it");
        limitatore.loginFallito("1.1.1.1", "a@b.it");
        limitatore.loginRiuscito("1.1.1.1", "a@b.it");
        limitatore.loginFallito("1.1.1.1", "a@b.it");
        limitatore.loginFallito("1.1.1.1", "a@b.it");

        assertThatCode(() -> limitatore.verificaLogin("1.1.1.1", "a@b.it")).doesNotThrowAnyException();
    }

    @Test
    void registrazioneEPasswordDimenticata_finestraScorrevoleDiUnOra() {
        limitatore.registrazione("1.1.1.1");
        orologio.avanza(Duration.ofMinutes(30));
        limitatore.registrazione("1.1.1.1");
        assertThatThrownBy(() -> limitatore.registrazione("1.1.1.1")).isInstanceOf(TroppiTentativiException.class);

        // Dopo un'ora dalla prima richiesta si libera un posto, non due
        orologio.avanza(Duration.ofMinutes(31));
        limitatore.registrazione("1.1.1.1");
        assertThatThrownBy(() -> limitatore.registrazione("1.1.1.1")).isInstanceOf(TroppiTentativiException.class);

        limitatore.passwordDimenticata("a@b.it");
        limitatore.passwordDimenticata("a@b.it");
        assertThatThrownBy(() -> limitatore.passwordDimenticata("a@b.it")).isInstanceOf(TroppiTentativiException.class);
        assertThatCode(() -> limitatore.passwordDimenticata("c@d.it")).doesNotThrowAnyException();
    }

    private static class OrologioManuale extends Clock {

        private Instant adesso = Instant.parse("2026-01-01T10:00:00Z");

        void avanza(Duration durata) {
            adesso = adesso.plus(durata);
        }

        @Override
        public Instant instant() {
            return adesso;
        }

        @Override
        public ZoneId getZone() {
            return ZoneOffset.UTC;
        }

        @Override
        public Clock withZone(ZoneId zone) {
            return this;
        }
    }
}
