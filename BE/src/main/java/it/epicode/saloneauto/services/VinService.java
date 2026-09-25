package it.epicode.saloneauto.services;

import it.epicode.saloneauto.entities.Carburante;
import it.epicode.saloneauto.exceptions.BadRequestException;
import it.epicode.saloneauto.payloads.VinDecodificaResponse;
import it.epicode.saloneauto.payloads.VinFormato;
import it.epicode.saloneauto.services.autodev.AutoDevClient;
import it.epicode.saloneauto.services.autodev.AutoDevVin;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class VinService {

    private static final int DIMENSIONE_CACHE = 500;

    private final AutoDevClient autoDevClient;

    // Cache LRU in memoria: i dati di un VIN non cambiano e il piano free ha 1.000 chiamate al mese
    private final Map<String, VinDecodificaResponse> cache = Collections.synchronizedMap(
            new LinkedHashMap<>(16, 0.75f, true) {
                @Override
                protected boolean removeEldestEntry(Map.Entry<String, VinDecodificaResponse> eldest) {
                    return size() > DIMENSIONE_CACHE;
                }
            });

    public VinDecodificaResponse decodifica(String vinRicevuto) {
        // Validato prima di costruire l'URL verso Auto.dev
        if (!VinFormato.valido(vinRicevuto)) {
            throw new BadRequestException("VIN non valido: servono 17 caratteri alfanumerici, senza I, O e Q");
        }
        String vin = VinFormato.normalizza(vinRicevuto);
        VinDecodificaResponse inCache = cache.get(vin);
        if (inCache != null) {
            return inCache;
        }
        VinDecodificaResponse risposta = converti(vin, autoDevClient.decodificaVin(vin));
        cache.put(vin, risposta);
        return risposta;
    }

    private VinDecodificaResponse converti(String vin, AutoDevVin d) {
        AutoDevVin.Veicolo v = d.vehicle();
        String marca = pulisci(primoValorizzato(v == null ? null : v.make(), d.make()), 50);
        String modello = pulisci(primoValorizzato(v == null ? null : v.model(), d.model()), 80);
        String allestimento = pulisci(d.trim(), 80);
        Integer anno = v == null ? null : v.year();
        String titolo = Stream.of(marca, modello, allestimento)
                .filter(s -> s != null && !s.isBlank())
                .collect(Collectors.joining(" "));
        return new VinDecodificaResponse(vin, marca, modello, anno, allestimento,
                pulisci(d.engine(), 100), pulisci(d.body(), 50), pulisci(d.drive(), 30),
                pulisci(d.transmission(), 50), deduciCarburante(d.engine()),
                titolo.isBlank() ? null : pulisci(titolo, 150), Boolean.TRUE.equals(d.ambiguous()));
    }

    /**
     * Auto.dev non restituisce il carburante come campo a sé: lo si deduce dalla descrizione
     * del motore solo quando è esplicito. Negli altri casi lo sceglie l'admin.
     */
    static Carburante deduciCarburante(String motore) {
        if (motore == null) {
            return null;
        }
        String m = motore.toLowerCase(Locale.ROOT);
        if (m.contains("hybrid") || m.contains("phev")) {
            return Carburante.IBRIDA;
        }
        if (m.contains("electric")) {
            return Carburante.ELETTRICA;
        }
        if (m.contains("diesel") || m.contains("tdi") || m.contains("crdi")) {
            return Carburante.DIESEL;
        }
        if (m.contains("cng")) {
            return Carburante.METANO;
        }
        if (m.contains("lpg")) {
            return Carburante.GPL;
        }
        return null;
    }

    private static String primoValorizzato(String a, String b) {
        return a != null && !a.isBlank() ? a : b;
    }

    // Testo esterno: niente caratteri di controllo e lunghezza compatibile con le colonne del DB
    private static String pulisci(String valore, int max) {
        if (valore == null) {
            return null;
        }
        String pulito = valore.replaceAll("\\p{Cntrl}", " ").trim();
        return pulito.length() > max ? pulito.substring(0, max) : pulito;
    }
}
