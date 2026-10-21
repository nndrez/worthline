package it.andrea.worthline.transactions.internal.model;

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
@Table(name = "transactions")
public class Transaction {
    @Id
    private UUID id;
    @Column(name = "transaction_date", nullable = false)
    private LocalDate date;
    @Column(nullable = false, length = 255)
    private String description;
    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal amount;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 16)
    private TransactionType type;
    @Column(name = "category_id", nullable = false)
    private UUID categoryId;
    @Column(length = 100)
    private String tag;
    @Column(length = 2000)
    private String notes;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 3)
    @Setter(AccessLevel.NONE)
    private Currency currency = Currency.EUR;
}
