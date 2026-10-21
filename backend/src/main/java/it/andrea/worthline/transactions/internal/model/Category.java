package it.andrea.worthline.transactions.internal.model;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import jakarta.persistence.*;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "categories")
public class Category {
    @Id
    private UUID id;
    @Column(nullable = false, length = 100)
    private String name;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 16)
    private TransactionType type;
    @Column(name = "parent_id")
    private UUID parentId;
}
