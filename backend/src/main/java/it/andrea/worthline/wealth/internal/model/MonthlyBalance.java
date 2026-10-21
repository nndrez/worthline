package it.andrea.worthline.wealth.internal.model;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import jakarta.persistence.*;
import java.util.UUID;
import java.time.LocalDate;
import java.math.BigDecimal;
import it.andrea.worthline.core.Currency;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "monthly_balances")
public class MonthlyBalance {
    @Id
    private UUID id;
    @Column(name = "account_id", nullable = false)
    private UUID accountId;
    @Column(name = "balance_date", nullable = false)
    private LocalDate date;
    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal amount;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 3)
    @Setter(AccessLevel.NONE)
    private Currency currency = Currency.EUR;
}
