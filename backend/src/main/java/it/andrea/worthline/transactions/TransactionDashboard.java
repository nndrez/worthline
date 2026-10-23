package it.andrea.worthline.transactions;

import it.andrea.worthline.core.Currency;
import java.math.BigDecimal;
import java.time.YearMonth;
import java.util.List;

public interface TransactionDashboard {
    Metric income(YearMonth month);
    Metric expenses(YearMonth month);
    Metric cashFlow(YearMonth month);

    record MetricPoint(YearMonth month, BigDecimal amount, long transactionCount) {}
    record Metric(YearMonth month, Currency currency, BigDecimal amount, long transactionCount, List<MetricPoint> history, Comparison comparison) {}
    record Comparison(YearMonth month, BigDecimal amount, BigDecimal difference, long transactionCount) {}
}
