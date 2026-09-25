package it.epicode.saloneauto.events;

import java.math.BigDecimal;

public record PrezzoScesoEvent(Long autoId, BigDecimal prezzoVecchio, BigDecimal prezzoNuovo) {
}
