package it.andrea.worthline.portfolio.internal.dto;

import jakarta.validation.constraints.*;
import java.util.UUID;
import java.time.LocalDate;
import java.math.BigDecimal;
import it.andrea.worthline.core.Currency;
import it.andrea.worthline.portfolio.internal.model.*;
public record OperationResponse(UUID id, UUID instrumentId, LocalDate date, OperationType type, String market, String broker, BigDecimal unitPrice, BigDecimal quantity, BigDecimal amount, String notes, Currency currency) {}
