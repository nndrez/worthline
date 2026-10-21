package it.andrea.worthline.transactions.internal.dto;

import it.andrea.worthline.transactions.internal.model.*;
import java.util.UUID;

public record CategorySearchCriteria(
        String name,
        TransactionType type,
        UUID parentId,
        Boolean rootOnly) {}
