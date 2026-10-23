package it.andrea.worthline.portfolio.internal.dto;

import java.math.BigDecimal;
import it.andrea.worthline.core.Currency;

public record InstrumentSummary(InstrumentResponse instrument, Currency currency, long operationCount,
        BigDecimal purchases, BigDecimal sales, BigDecimal dividends, BigDecimal quantity) {}
