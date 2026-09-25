package it.epicode.saloneauto.payloads;

import it.epicode.saloneauto.entities.Carburante;
import it.epicode.saloneauto.entities.Condizione;

import java.math.BigDecimal;

/**
 * Filtri del catalogo, legati dai parametri della query string (?q=...&marca=...).
 * Tutti facoltativi; diventano parametri legati in AutoSpecifications.
 */
public record FiltriRicerca(String q, String marca, String modello, Carburante carburante, Condizione condizione,
                            BigDecimal prezzoMin, BigDecimal prezzoMax, Integer kmMax,
                            Integer annoMin, Integer annoMax) {
}
