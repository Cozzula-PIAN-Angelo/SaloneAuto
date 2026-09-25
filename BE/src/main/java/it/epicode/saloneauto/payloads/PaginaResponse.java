package it.epicode.saloneauto.payloads;

import org.springframework.data.domain.Page;

import java.util.List;
import java.util.function.Function;

public record PaginaResponse<T>(List<T> contenuto, int pagina, int dimensione, long totaleElementi, int totalePagine) {

    public static <E, T> PaginaResponse<T> da(Page<E> page, Function<E, T> mapper) {
        return new PaginaResponse<>(page.getContent().stream().map(mapper).toList(),
                page.getNumber(), page.getSize(), page.getTotalElements(), page.getTotalPages());
    }
}
