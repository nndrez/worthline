package it.andrea.worthline.wealth;

import it.andrea.worthline.core.Currency;
import java.math.BigDecimal;
import java.time.YearMonth;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/** Read-only reporting boundary; no persistence types escape the module. */
public interface WealthDashboard {
    WealthCard wealth(YearMonth month, int periods);
    AllocationCard allocation(YearMonth month);
    CurrentSituation currentSituation(YearMonth month);

    record HistoryGroup(String type, BigDecimal total, long count, boolean partial) {}
    record HistoryPoint(YearMonth month, BigDecimal total, long count, boolean partial, List<HistoryGroup> groups) {}
    record WealthCard(YearMonth month, Currency currency, BigDecimal total, long missing,
                      List<HistoryPoint> history) {}
    record AllocationGroup(String type, BigDecimal total, BigDecimal percentage) {}
    record AllocationCard(YearMonth month, Currency currency, BigDecimal total, boolean available,
                          List<AllocationGroup> groups) {}
    record CurrentSituation(YearMonth month, Currency currency, BigDecimal total, long missing, List<AccountBalance> accounts, Comparison comparison) {}
    record Comparison(YearMonth month, BigDecimal amount, BigDecimal difference, long missing) {}
    record AccountBalance(UUID id, String name, String type, BigDecimal balance, LocalDate date, Currency currency) {}
}
