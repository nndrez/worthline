package it.andrea.worthline.portfolio.internal.model;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import jakarta.persistence.*;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "instruments")
public class Instrument {
    @Id
    private UUID id;
    @Column(nullable = false, length = 32)
    private String code;
    @Column(nullable = false, length = 255)
    private String name;
    @Column(length = 12)
    private String isin;
    @Column(length = 32)
    private String ticker;
}
