package it.andrea.worthline.transactions.internal.dto;

import jakarta.validation.constraints.*;
import java.util.UUID;
import java.time.LocalDate;
import java.math.BigDecimal;
import it.andrea.worthline.core.Currency;
import it.andrea.worthline.transactions.internal.model.*;
public record TransactionResponse(UUID id, LocalDate date, String description, BigDecimal amount, TransactionType type, UUID categoryId, String tag, String notes, Currency currency) {}
