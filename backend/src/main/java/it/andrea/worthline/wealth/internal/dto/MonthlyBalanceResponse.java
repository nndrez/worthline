package it.andrea.worthline.wealth.internal.dto;

import jakarta.validation.constraints.*;
import java.util.UUID;
import java.time.LocalDate;
import java.math.BigDecimal;
import it.andrea.worthline.core.Currency;
import it.andrea.worthline.wealth.internal.model.*;
public record MonthlyBalanceResponse(UUID id, UUID accountId, LocalDate date, BigDecimal amount, Currency currency) {}
