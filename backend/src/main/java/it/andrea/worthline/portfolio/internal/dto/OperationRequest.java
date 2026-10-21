package it.andrea.worthline.portfolio.internal.dto;

import jakarta.validation.constraints.*;
import java.util.UUID;
import java.time.LocalDate;
import java.math.BigDecimal;
import it.andrea.worthline.portfolio.internal.model.*;
public record OperationRequest(
        @NotNull UUID instrumentId,
        @NotNull LocalDate date,
        @NotNull OperationType type,
        @Size(max = 100) String market,
        @Size(max = 100) String broker,
        @DecimalMin("0.000001") @Digits(integer = 13, fraction = 6) BigDecimal unitPrice,
        @DecimalMin("0.000001") @Digits(integer = 13, fraction = 6) BigDecimal quantity,
        @NotNull @Digits(integer = 17, fraction = 2) @DecimalMin("0.01") BigDecimal amount,
        @Size(max = 2000) String notes) {}
