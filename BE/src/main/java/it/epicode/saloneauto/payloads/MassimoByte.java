package it.epicode.saloneauto.payloads;

import jakarta.validation.Constraint;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import jakarta.validation.Payload;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import java.nio.charset.StandardCharsets;

/**
 * Lunghezza massima in byte UTF-8, non in caratteri. Serve per le password: BCrypt
 * accetta al massimo 72 byte e oltre lancia un'eccezione (500), mentre una lettera
 * accentata occupa 2 byte e quindi 72 caratteri possono superare il limite.
 */
@Target({ElementType.FIELD, ElementType.PARAMETER, ElementType.RECORD_COMPONENT})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = MassimoByte.Validatore.class)
public @interface MassimoByte {

    int value();

    String message() default "troppo lunga (massimo {value} byte: le lettere accentate contano doppio)";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};

    class Validatore implements ConstraintValidator<MassimoByte, String> {

        private int massimo;

        @Override
        public void initialize(MassimoByte annotazione) {
            this.massimo = annotazione.value();
        }

        @Override
        public boolean isValid(String valore, ConstraintValidatorContext context) {
            return valore == null || valore.getBytes(StandardCharsets.UTF_8).length <= massimo;
        }
    }
}
