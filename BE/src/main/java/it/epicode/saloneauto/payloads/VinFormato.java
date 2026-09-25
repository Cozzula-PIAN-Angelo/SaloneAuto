package it.epicode.saloneauto.payloads;

import java.util.Locale;
import java.util.regex.Pattern;

/** Formato del VIN (ISO 3779): 17 caratteri alfanumerici, escluse I, O e Q. */
public final class VinFormato {

    public static final String REGEX = "^[A-HJ-NPR-Za-hj-npr-z0-9]{17}$";
    private static final Pattern PATTERN = Pattern.compile(REGEX);

    private VinFormato() {
    }

    public static boolean valido(String vin) {
        return vin != null && PATTERN.matcher(vin).matches();
    }

    public static String normalizza(String vin) {
        return vin == null ? null : vin.toUpperCase(Locale.ROOT);
    }
}
