package it.andrea.worthline.portfolio.internal.dto;

import it.andrea.worthline.portfolio.internal.model.*;
import java.time.LocalDate;
import java.util.UUID;

public record OperationSearchCriteria(
        LocalDate from,
        LocalDate to,
        OperationType type,
        UUID instrumentId,
        String broker,
        String market) {}
