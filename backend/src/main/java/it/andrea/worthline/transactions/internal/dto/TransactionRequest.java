package it.andrea.worthline.transactions.internal.dto;

import jakarta.validation.constraints.*;
import java.util.UUID;
import java.time.LocalDate;
import java.math.BigDecimal;
import it.andrea.worthline.transactions.internal.model.*;
public record TransactionRequest(
        @NotNull LocalDate date,
        @NotBlank @Size(max = 255) String description,
        @NotNull @Digits(integer = 17, fraction = 2) @DecimalMin("0.01") BigDecimal amount,
        @NotNull TransactionType type,
        @NotNull UUID categoryId,
        @Size(max = 100) String tag,
        @Size(max = 2000) String notes) {}
