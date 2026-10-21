package it.andrea.worthline.core;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Objects;
public record Money(BigDecimal amount, Currency currency) {
    public Money {
        Objects.requireNonNull(amount, "Amount is required");
        Objects.requireNonNull(currency, "Currency is required");
        amount = amount.setScale(2, RoundingMode.UNNECESSARY);
    }
    public static Money euros(BigDecimal amount) {
        return new Money(amount, Currency.EUR);
    }
}
