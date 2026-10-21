package it.andrea.worthline.wealth.internal.dto;

import jakarta.validation.constraints.*;
import java.util.UUID;
import java.time.LocalDate;
import java.math.BigDecimal;
import it.andrea.worthline.wealth.internal.model.*;
public record MonthlyBalanceRequest(
        @NotNull UUID accountId,
        @NotNull LocalDate date,
        @NotNull @Digits(integer = 17, fraction = 2) BigDecimal amount) {}
