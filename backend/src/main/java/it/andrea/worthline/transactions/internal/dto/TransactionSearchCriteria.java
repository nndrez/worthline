package it.andrea.worthline.transactions.internal.dto;

import it.andrea.worthline.transactions.internal.model.*;
import java.time.LocalDate;
import java.util.UUID;

public record TransactionSearchCriteria(
        LocalDate from,
        LocalDate to,
        TransactionType type,
        UUID categoryId,
        String description,
        String tag) {}
