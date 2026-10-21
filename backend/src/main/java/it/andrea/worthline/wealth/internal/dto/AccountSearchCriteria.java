package it.andrea.worthline.wealth.internal.dto;

import it.andrea.worthline.wealth.internal.model.*;

public record AccountSearchCriteria(
        String name,
        AccountType type) {}
