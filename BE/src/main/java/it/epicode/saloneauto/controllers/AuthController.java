package it.epicode.saloneauto.controllers;

import it.epicode.saloneauto.payloads.*;
import it.epicode.saloneauto.services.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/registrazione")
    @ResponseStatus(HttpStatus.CREATED)
    public UtenteResponse registrazione(@RequestBody @Valid RegistrazioneRequest body, HttpServletRequest request) {
        return authService.registra(body, request.getRemoteAddr());
    }

    @PostMapping("/login")
    // getRemoteAddr e non X-Forwarded-For: quell'header lo può scrivere chiunque
    public LoginResponse login(@RequestBody @Valid LoginRequest body, HttpServletRequest request) {
        return authService.login(body, request.getRemoteAddr());
    }

    @PostMapping("/password-dimenticata")
    public MessaggioResponse passwordDimenticata(@RequestBody @Valid PasswordDimenticataRequest body) {
        authService.passwordDimenticata(body);
        return new MessaggioResponse("Se l'indirizzo è registrato, riceverai una mail con le istruzioni");
    }

    @PostMapping("/reset-password")
    public MessaggioResponse resetPassword(@RequestBody @Valid ResetPasswordRequest body) {
        authService.resetPassword(body);
        return new MessaggioResponse("Password aggiornata");
    }
}
