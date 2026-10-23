package it.andrea.worthline.transactions.internal.service;

import it.andrea.worthline.core.Currency;
import it.andrea.worthline.transactions.TransactionDashboard;
import it.andrea.worthline.transactions.internal.model.TransactionType;
import it.andrea.worthline.transactions.internal.repository.TransactionRepository;
import it.andrea.worthline.transactions.internal.repository.TransactionRepository.MonthlyTotal;
import java.time.YearMonth;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.IntStream;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TransactionDashboardService implements TransactionDashboard {
    private final TransactionRepository transactions;
    private final java.time.Clock clock;

    @Override
    public Metric income(YearMonth month) {
        return metric(month, period -> transactions.monthlyTotals(period.atDay(1), period.plusMonths(11).atEndOfMonth(), TransactionType.INCOME));
    }

    @Override
    public Metric expenses(YearMonth month) {
        return metric(month, period -> transactions.monthlyTotals(period.atDay(1), period.plusMonths(11).atEndOfMonth(), TransactionType.EXPENSE));
    }

    @Override
    public Metric cashFlow(YearMonth month) {
        return metric(month, period -> transactions.monthlyCashFlow(period.atDay(1), period.plusMonths(11).atEndOfMonth()));
    }

    private Metric metric(YearMonth month, Function<YearMonth, List<MonthlyTotal>> query) {
        List<MonthlyTotal> totals = query.apply(YearMonth.of(month.getYear(), 1));
        Map<Integer, MonthlyTotal> byMonth = totals.stream().collect(Collectors.toMap(MonthlyTotal::getMonth, Function.identity()));
        List<MetricPoint> history = IntStream.rangeClosed(1, 12).mapToObj(number -> {
            MonthlyTotal value = byMonth.get(number);
            return new MetricPoint(YearMonth.of(month.getYear(), number), value == null ? BigDecimal.ZERO : value.getAmount(),
                    value == null ? 0 : value.getTransactionCount());
        }).toList();
        MetricPoint selected = history.get(month.getMonthValue() - 1);
        YearMonth current = YearMonth.now(clock);
        Comparison comparison = null;
        if (!month.equals(current)) {
            List<MonthlyTotal> currentTotals = month.getYear() == current.getYear() ? totals : query.apply(YearMonth.of(current.getYear(), 1));
            MonthlyTotal actual = currentTotals.stream().filter(value -> value.getMonth() == current.getMonthValue()).findFirst().orElse(null);
            BigDecimal amount = actual == null ? BigDecimal.ZERO : actual.getAmount();
            long count = actual == null ? 0 : actual.getTransactionCount();
            comparison = new Comparison(current, amount, count > 0 && selected.transactionCount() > 0 ? amount.subtract(selected.amount()) : null, count);
        }
        return new Metric(month, Currency.EUR, selected.amount(), selected.transactionCount(), history, comparison);
    }
}
