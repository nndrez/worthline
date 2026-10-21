package it.andrea.worthline.portfolio.internal.model;

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
@Table(name = "investment_operations")
public class Operation {
    @Id
    private UUID id;
    @Column(name = "instrument_id", nullable = false)
    private UUID instrumentId;
    @Column(name = "operation_date", nullable = false)
    private LocalDate date;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 16)
    private OperationType type;
    @Column(length = 100)
    private String market;
    @Column(length = 100)
    private String broker;
    @Column(name = "unit_price", precision = 19, scale = 6)
    private BigDecimal unitPrice;
    @Column(precision = 19, scale = 6)
    private BigDecimal quantity;
    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal amount;
    @Column(length = 2000)
    private String notes;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 3)
    @Setter(AccessLevel.NONE)
    private Currency currency = Currency.EUR;
}
