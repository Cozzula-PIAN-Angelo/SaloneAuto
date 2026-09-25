package it.epicode.saloneauto.services;

import it.epicode.saloneauto.entities.Auto;
import it.epicode.saloneauto.entities.ImmagineAuto;
import it.epicode.saloneauto.exceptions.BadRequestException;
import it.epicode.saloneauto.exceptions.NotFoundException;
import it.epicode.saloneauto.payloads.AutoResponse;
import it.epicode.saloneauto.repositories.ImmagineAutoRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Service
@Slf4j
public class ImmagineService {

    public static final int MASSIMO_IMMAGINI = 10;

    private final AutoService autoService;
    private final ImmagineAutoRepository immagineRepository;
    private final Path cartella;

    public ImmagineService(AutoService autoService, ImmagineAutoRepository immagineRepository,
                           @Value("${app.upload-dir}") String uploadDir) {
        this.autoService = autoService;
        this.immagineRepository = immagineRepository;
        this.cartella = Path.of(uploadDir).toAbsolutePath().normalize();
    }

    @Transactional
    public AutoResponse carica(Long autoId, List<MultipartFile> files) {
        Auto auto = autoService.trova(autoId);
        if (files == null || files.isEmpty()) {
            throw new BadRequestException("Nessun file ricevuto");
        }
        if (auto.getImmagini().size() + files.size() > MASSIMO_IMMAGINI) {
            throw new BadRequestException("Massimo " + MASSIMO_IMMAGINI + " immagini per annuncio");
        }
        // Prima si validano tutti i file, così un file non valido non lascia upload a metà
        List<String> estensioni = files.stream().map(this::estensioneDaContenuto).toList();

        List<Path> scritti = new ArrayList<>();
        cancellaFileSeRollback(scritti);
        int ordine = auto.getImmagini().stream().mapToInt(ImmagineAuto::getOrdine).max().orElse(-1) + 1;
        for (int i = 0; i < files.size(); i++) {
            String nomeFile = UUID.randomUUID() + estensioni.get(i);
            Path destinazione = cartella.resolve(nomeFile);
            try (InputStream in = files.get(i).getInputStream()) {
                Files.copy(in, destinazione);
            } catch (IOException e) {
                throw new UncheckedIOException("Salvataggio immagine fallito", e);
            }
            scritti.add(destinazione);
            // save esplicito: l'id serve subito nella risposta (per poter poi eliminare l'immagine)
            auto.getImmagini().add(immagineRepository.save(new ImmagineAuto(auto, nomeFile, ordine++)));
        }
        return AutoResponse.da(auto);
    }

    @Transactional
    public AutoResponse elimina(Long autoId, Long immagineId) {
        Auto auto = autoService.trova(autoId);
        ImmagineAuto immagine = immagineRepository.findByIdAndAutoId(immagineId, autoId)
                .orElseThrow(() -> new NotFoundException("Immagine non trovata"));
        auto.getImmagini().remove(immagine);
        Path file = cartella.resolve(immagine.getNomeFile());
        // Il file si cancella solo se la rimozione dal DB va a buon fine
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                cancellaSilenziosamente(file);
            }
        });
        return AutoResponse.da(auto);
    }

    /**
     * Il tipo si ricava dai primi byte del file (magic number), non dal Content-Type
     * né dal nome, che il client può dichiarare a piacere.
     */
    private String estensioneDaContenuto(MultipartFile file) {
        byte[] testa;
        try (InputStream in = file.getInputStream()) {
            testa = in.readNBytes(12);
        } catch (IOException e) {
            throw new BadRequestException("File non leggibile");
        }
        if (inizia(testa, 0, 0xFF, 0xD8, 0xFF)) {
            return ".jpg";
        }
        if (inizia(testa, 0, 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A)) {
            return ".png";
        }
        if (inizia(testa, 0, 'R', 'I', 'F', 'F') && inizia(testa, 8, 'W', 'E', 'B', 'P')) {
            return ".webp";
        }
        throw new BadRequestException("Formato non supportato: sono ammessi JPEG, PNG e WEBP");
    }

    private static boolean inizia(byte[] dati, int offset, int... attesi) {
        if (dati.length < offset + attesi.length) {
            return false;
        }
        return Arrays.equals(Arrays.copyOfRange(dati, offset, offset + attesi.length), toBytes(attesi));
    }

    private static byte[] toBytes(int[] valori) {
        byte[] b = new byte[valori.length];
        for (int i = 0; i < valori.length; i++) {
            b[i] = (byte) valori[i];
        }
        return b;
    }

    private void cancellaFileSeRollback(List<Path> scritti) {
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCompletion(int status) {
                if (status != STATUS_COMMITTED) {
                    scritti.forEach(ImmagineService::cancellaSilenziosamente);
                }
            }
        });
    }

    private static void cancellaSilenziosamente(Path file) {
        try {
            Files.deleteIfExists(file);
        } catch (IOException e) {
            log.warn("Impossibile cancellare il file {}", file.getFileName());
        }
    }
}
