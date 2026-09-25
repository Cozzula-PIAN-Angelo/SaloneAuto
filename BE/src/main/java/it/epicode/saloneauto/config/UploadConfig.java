package it.epicode.saloneauto.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;

/** Serve le immagini caricate dall'admin come file statici su /uploads/**. */
@Configuration
public class UploadConfig implements WebMvcConfigurer {

    private final Path cartella;

    public UploadConfig(@Value("${app.upload-dir}") String uploadDir) {
        this.cartella = Path.of(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(cartella);
        } catch (IOException e) {
            throw new UncheckedIOException("Impossibile creare la cartella degli upload", e);
        }
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String posizione = cartella.toUri().toString();
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(posizione.endsWith("/") ? posizione : posizione + "/");
    }
}
