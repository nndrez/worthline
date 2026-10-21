package it.andrea.worthline.core;

import org.junit.jupiter.api.Test;
import java.math.BigDecimal;
import static org.assertj.core.api.Assertions.*;

class MoneyTests {
    @Test
    void normalizesEuroAmountsWithoutSilentlyRounding() {
        assertThat(Money.euros(new BigDecimal("12.3")).amount()).isEqualTo(new BigDecimal("12.30"));
        assertThat(Money.euros(new BigDecimal("-12.3")).amount()).isEqualTo(new BigDecimal("-12.30"));
        assertThat(Money.euros(BigDecimal.ZERO).amount()).isEqualTo(new BigDecimal("0.00"));
        assertThatThrownBy(() -> Money.euros(new BigDecimal("12.345"))).isInstanceOf(ArithmeticException.class);
    }
}
