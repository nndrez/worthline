package it.andrea.worthline.portfolio.internal.dto;

import it.andrea.worthline.portfolio.internal.model.*;

public record InstrumentSearchCriteria(
        String code,
        String name,
        String isin,
        String ticker) {}
