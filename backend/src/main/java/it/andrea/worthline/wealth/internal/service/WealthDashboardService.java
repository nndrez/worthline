package it.andrea.worthline.wealth.internal.service;

import it.andrea.worthline.core.Currency;
import it.andrea.worthline.wealth.WealthDashboard;
import it.andrea.worthline.wealth.internal.dto.AccountSearchCriteria;
import it.andrea.worthline.wealth.internal.model.Account;
import it.andrea.worthline.wealth.internal.model.AccountSpecification;
import it.andrea.worthline.wealth.internal.model.MonthlyBalance;
import it.andrea.worthline.wealth.internal.repository.AccountRepository;
import it.andrea.worthline.wealth.internal.repository.MonthlyBalanceRepository;
import it.andrea.worthline.wealth.internal.repository.MonthlyBalanceRepository.PeriodTotal;
import it.andrea.worthline.wealth.internal.repository.MonthlyBalanceRepository.TypeTotal;
import it.andrea.worthline.wealth.internal.repository.MonthlyBalanceRepository.PeriodTypeTotal;
import it.andrea.worthline.wealth.internal.repository.AccountRepository.TypeCount;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class WealthDashboardService implements WealthDashboard {
    private final AccountRepository accounts;
    private final MonthlyBalanceRepository balances;
    private final java.time.Clock clock;

    @Override
    public WealthCard wealth(YearMonth month, int periods) {
        long accountCount = accounts.count();
        YearMonth first = month.minusMonths(periods - 1L);
        Map<YearMonth, PeriodTotal> totals = balances.totals(first.atEndOfMonth(), month.atEndOfMonth())
                .stream().collect(Collectors.toMap(point -> YearMonth.from(point.getDate()), Function.identity()));
        List<TypeCount> typeCounts = accounts.countsByType();
        List<PeriodTypeTotal> grouped = balances.totalsByType(first.atEndOfMonth(), month.atEndOfMonth());
        List<HistoryPoint> history = new ArrayList<>();
        for (int index = 0; index < periods; index++) {
            YearMonth period = first.plusMonths(index);
            PeriodTotal total = totals.get(period);
            long count = total == null ? 0 : total.getRecorded();
            history.add(new HistoryPoint(period, total == null ? null : total.getAmount(), count,
                    count > 0 && count < accountCount, historyGroups(period, typeCounts, grouped)));
        }
        HistoryPoint current = history.getLast();
        return new WealthCard(month, Currency.EUR, current.total(), accountCount - current.count(), List.copyOf(history));
    }

    private List<HistoryGroup> historyGroups(YearMonth month, List<TypeCount> expected, List<PeriodTypeTotal> totals) {
        Map<String, PeriodTypeTotal> values = totals.stream().filter(point -> YearMonth.from(point.getDate()).equals(month))
                .collect(Collectors.toMap(PeriodTypeTotal::getType, Function.identity()));
        return expected.stream().map(type -> {
            PeriodTypeTotal value = values.get(type.getType());
            long count = value == null ? 0 : value.getRecorded();
            return new HistoryGroup(type.getType(), value == null ? null : value.getAmount(), count,
                    count > 0 && count < type.getCount());
        }).toList();
    }

    @Override
    public AllocationCard allocation(YearMonth month) {
        List<TypeTotal> totals = balances.latestAllocation(month.atEndOfMonth());
        List<BigDecimal> recorded = totals.stream().map(TypeTotal::getAmount).filter(amount -> amount != null).toList();
        BigDecimal total = recorded.isEmpty() ? null : recorded.stream().reduce(BigDecimal.ZERO, BigDecimal::add);
        boolean available = total != null && total.signum() > 0 && recorded.stream().allMatch(amount -> amount.signum() >= 0);
        List<AllocationGroup> groups = totals.stream().map(group -> new AllocationGroup(group.getType(), group.getAmount(),
                available && group.getAmount() != null ? percentage(group.getAmount(), total) : BigDecimal.ZERO)).toList();
        return new AllocationCard(month, Currency.EUR, total, available, groups);
    }

    @Override
    public CurrentSituation currentSituation(YearMonth month) {
        // This dashboard document explicitly contains all accounts, rather than a CRUD page.
        List<Account> registered = accounts.findAll(
                AccountSpecification.withCriteria(new AccountSearchCriteria(null, null)), Sort.by("name", "id"));
        List<UUID> ids = registered.stream().map(Account::getId).toList();
        Map<UUID, MonthlyBalance> values = ids.isEmpty() ? Map.of() : balances.latestForAccounts(ids, month.atEndOfMonth())
                .stream().collect(Collectors.toMap(MonthlyBalance::getAccountId, Function.identity()));
        List<AccountBalance> result = registered.stream().map(account -> {
            MonthlyBalance value = values.get(account.getId());
            return new AccountBalance(account.getId(), account.getName(), account.getType().name(),
                    value == null ? null : value.getAmount(), value == null ? null : value.getDate(), Currency.EUR);
        }).toList();
        BigDecimal total = values.isEmpty() ? null : values.values().stream()
                .map(MonthlyBalance::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        YearMonth current = YearMonth.now(clock);
        Comparison comparison = null;
        if (!current.equals(month)) {
            List<MonthlyBalance> actual = ids.isEmpty() ? List.of() : balances.latestForAccounts(ids, current.atEndOfMonth());
            BigDecimal actualTotal = actual.isEmpty() ? null : actual.stream().map(MonthlyBalance::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
            boolean complete = actual.size() == registered.size() && values.size() == registered.size();
            comparison = new Comparison(current, actualTotal,
                    complete && total != null && actualTotal != null ? actualTotal.subtract(total) : null, registered.size() - actual.size());
        }
        return new CurrentSituation(month, Currency.EUR, total, registered.size() - values.size(), result, comparison);
    }

    private static BigDecimal percentage(BigDecimal part, BigDecimal total) {
        return part.multiply(BigDecimal.valueOf(100)).divide(total, 2, RoundingMode.HALF_UP);
    }
}
