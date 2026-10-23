package it.andrea.worthline;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Import({BaseModulesIntegrationTests.Database.class, DashboardIntegrationTests.FixedTime.class})
class DashboardIntegrationTests {
    @org.springframework.boot.test.context.TestConfiguration
    static class FixedTime {
        @org.springframework.context.annotation.Bean
        @org.springframework.context.annotation.Primary
        java.time.Clock fixedClock() {
            return java.time.Clock.fixed(java.time.Instant.parse("2026-10-23T10:00:00Z"), java.time.ZoneId.of("Europe/Rome"));
        }
    }
    @Autowired MockMvc mvc;
    @Autowired JdbcTemplate jdbc;

    @BeforeEach
    void clearSyntheticData() {
        jdbc.execute("TRUNCATE transactions, categories, monthly_balances, accounts, investment_operations, instruments CASCADE");
    }

    @Test
    void everyFrontendDashboardResourceHasARealBackendContract() throws Exception {
        for (String resource : java.util.List.of("income", "expenses", "cash-flow", "current-situation", "allocation", "wealth")) {
            mvc.perform(get("/api/dashboard/" + resource).param("month", "2026-09"))
                    .andExpect(status().isOk()).andExpect(jsonPath("$.month").value("2026-09"))
                    .andExpect(jsonPath("$.currency").value("EUR"));
            mvc.perform(get("/api/dashboard/" + resource).param("month", "invalid"))
                    .andExpect(status().isBadRequest());
        }
        for (String resource : java.util.List.of("income", "expenses", "cash-flow")) {
            mvc.perform(get("/api/dashboard/" + resource).param("month", "2026-09"))
                    .andExpect(status().isOk()).andExpect(jsonPath("$.history.length()").value(12))
                    .andExpect(jsonPath("$.comparison.month").value("2026-10"))
                    .andExpect(jsonPath("$.comparison.transactionCount").value(0))
                    .andExpect(jsonPath("$.comparison.difference").isEmpty());
        }
    }

    @Test
    void historicalComparisonUsesCurrentYearAndPreservesMissingValues() throws Exception {
        UUID category = category("Pay", "INCOME");
        transaction(new TransactionSeed(category, "INCOME", "2025-01-02", "80.00"));
        transaction(new TransactionSeed(category, "INCOME", "2026-10-03", "120.00"));
        mvc.perform(get("/api/dashboard/income?month=2025-01"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.comparison.month").value("2026-10"))
                .andExpect(jsonPath("$.comparison.amount").value(120))
                .andExpect(jsonPath("$.comparison.difference").value(40));
        mvc.perform(get("/api/dashboard/income?month=2026-09"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.comparison.difference").isEmpty());
        mvc.perform(get("/api/dashboard/income?month=2026-10"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.comparison").isEmpty());
        UUID cash = account("Comparison cash", "CASH");
        balance(cash, "2025-01-31", "0.00");
        balance(cash, "2026-09-30", "200.00");
        mvc.perform(get("/api/dashboard/current-situation?month=2025-01"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.comparison.difference").value(200));
        account("Missing account", "PENSION");
        mvc.perform(get("/api/dashboard/current-situation?month=2025-01"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.comparison.missing").value(1))
                .andExpect(jsonPath("$.comparison.difference").isEmpty());
    }

    @Test
    void instrumentSummaryAggregatesTradesAndDividendsWithoutInventingMarketValue() throws Exception {
        UUID id = UUID.randomUUID();
        jdbc.update("INSERT INTO instruments(id,code,name) VALUES (?, 'TEST', 'Synthetic instrument')", id);
        mvc.perform(get("/api/instruments/" + id + "/summary"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.operationCount").value(0))
                .andExpect(jsonPath("$.quantity").value(0));
        jdbc.update("INSERT INTO investment_operations(id,instrument_id,operation_date,type,unit_price,quantity,amount,currency) VALUES (?,?,'2026-01-01','BUY',10,5,50,'EUR')", UUID.randomUUID(), id);
        jdbc.update("INSERT INTO investment_operations(id,instrument_id,operation_date,type,unit_price,quantity,amount,currency) VALUES (?,?,'2026-02-01','SELL',12,2,24,'EUR')", UUID.randomUUID(), id);
        jdbc.update("INSERT INTO investment_operations(id,instrument_id,operation_date,type,amount,currency) VALUES (?,?,'2026-03-01','DIVIDEND',1.23,'EUR')", UUID.randomUUID(), id);
        mvc.perform(get("/api/instruments/" + id + "/summary"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.operationCount").value(3))
                .andExpect(jsonPath("$.quantity").value(3)).andExpect(jsonPath("$.purchases").value(50))
                .andExpect(jsonPath("$.sales").value(24)).andExpect(jsonPath("$.dividends").value(1.23));
        mvc.perform(get("/api/instruments/" + UUID.randomUUID() + "/summary"))
                .andExpect(status().isNotFound()).andExpect(jsonPath("$.errorCode").value("instrument.not.found"));
    }

    @Test
    void missingSnapshotsStayMissingAndRecordedZeroIsNotCarriedForward() throws Exception {
        UUID cash = account("Alpha", "CASH");
        UUID fund = account("Beta", "INVESTMENT");
        balance(cash, "2026-01-31", "0.00");
        balance(fund, "2025-12-31", "40.00");
        mvc.perform(get("/api/dashboard/wealth?month=2026-01&periods=3"))
                .andDo(result -> { if (result.getResolvedException() != null) throw result.getResolvedException(); })
                .andExpect(status().isOk()).andExpect(jsonPath("$.currency").value("EUR"))
                .andExpect(jsonPath("$.total").value(0)).andExpect(jsonPath("$.missing").value(1))
                .andExpect(jsonPath("$.history.length()").value(3))
                .andExpect(jsonPath("$.history[0].month").value("2025-11"))
                .andExpect(jsonPath("$.history[0].total").isEmpty())
                .andExpect(jsonPath("$.history[1].total").value(40))
                .andExpect(jsonPath("$.history[1].partial").value(true));

    }

    @Test
    void metricsAggregateAllTransactionsWithExactDecimalsAndRespectMonthBoundaries() throws Exception {
        UUID incomeCategory = category("Salary", "INCOME");
        UUID expenseCategory = category("Food", "EXPENSE");
        transaction(new TransactionSeed(incomeCategory, "INCOME", "2026-01-01", "0.30"));
        transaction(new TransactionSeed(expenseCategory, "EXPENSE", "2026-01-31", "0.10"));
        for (int index = 0; index < 250; index++) {
            transaction(new TransactionSeed(incomeCategory, "INCOME", "2026-01-15", "0.01"));
        }
        transaction(new TransactionSeed(incomeCategory, "INCOME", "2025-12-31", "999.00"));
        transaction(new TransactionSeed(incomeCategory, "INCOME", "2026-02-01", "999.00"));
        mvc.perform(get("/api/dashboard/income?month=2026-01"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.amount").value(2.80))
                .andExpect(jsonPath("$.transactionCount").value(251));
        mvc.perform(get("/api/dashboard/expenses?month=2026-01"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.amount").value(0.10));
        mvc.perform(get("/api/dashboard/cash-flow?month=2026-01"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.amount").value(2.70))
                .andExpect(jsonPath("$.transactionCount").value(252));
    }

    @Test
    void allocationIsComputedByTheBackendAndDoesNotDrawNegativeSlices() throws Exception {
        UUID cash = account("Cash", "CASH");
        UUID fund = account("Fund", "INVESTMENT");
        balance(cash, "2026-01-31", "25.00");
        balance(fund, "2026-01-31", "75.00");
        mvc.perform(get("/api/dashboard/allocation?month=2026-01"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.available").value(true))
                .andExpect(jsonPath("$.total").value(100))
                .andExpect(jsonPath("$.groups[?(@.type == 'CASH')].percentage").value(org.hamcrest.Matchers.contains(25.0)));
        jdbc.update("update monthly_balances set amount = -10 where account_id = ?", cash);
        mvc.perform(get("/api/dashboard/allocation?month=2026-01"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.total").value(65))
                .andExpect(jsonPath("$.available").value(false));
    }

    @Test
    void emptyCardsAndInvalidFiltersHaveExplicitResponses() throws Exception {
        mvc.perform(get("/api/dashboard/wealth?month=2026-01"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.total").isEmpty())
                .andExpect(jsonPath("$.history.length()").value(6));
        mvc.perform(get("/api/dashboard/current-situation?month=2026-01"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.total").isEmpty())
                .andExpect(jsonPath("$.missing").value(0))
                .andExpect(jsonPath("$.accounts.length()").value(0));
        mvc.perform(get("/api/dashboard/allocation?month=2026-01"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.total").isEmpty())
                .andExpect(jsonPath("$.available").value(false));
        mvc.perform(get("/api/dashboard/income?month=2026-01"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.amount").value(0))
                .andExpect(jsonPath("$.transactionCount").value(0));
        mvc.perform(get("/api/dashboard/wealth?month=invalid"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.errorCode").value("common.request.invalid"));
        mvc.perform(get("/api/dashboard/wealth?month=2026-01&periods=120"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void zeroNetCashFlowWithRecordedTransactionsIsNotAnEmptyMonth() throws Exception {
        UUID income = category("Income", "INCOME");
        UUID expense = category("Expense", "EXPENSE");
        transaction(new TransactionSeed(income, "INCOME", "2026-01-01", "25.00"));
        transaction(new TransactionSeed(expense, "EXPENSE", "2026-01-31", "25.00"));
        mvc.perform(get("/api/dashboard/cash-flow?month=2026-01"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.amount").value(0))
                .andExpect(jsonPath("$.transactionCount").value(2));
    }

    @Test
    void situationContainsAllAccountsAndUsesOnlySnapshotsAtOrBeforeTheSelectedMonth() throws Exception {
        UUID cash = account("Alpha", "CASH");
        UUID fund = account("Beta", "INVESTMENT");
        UUID pension = account("Gamma", "PENSION");
        for (int index = 0; index < 10; index++) account("Missing " + index, "CASH");
        balance(cash, "2025-12-31", "900.00");
        balance(cash, "2026-01-31", "0.00");
        balance(fund, "2025-11-30", "100.25");
        balance(fund, "2025-12-31", "75.35");
        balance(fund, "2026-02-28", "9999.00");
        balance(pension, "2025-10-31", "24.65");
        mvc.perform(get("/api/dashboard/current-situation?month=2026-01"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.total").value(100))
                .andExpect(jsonPath("$.month").value("2026-01"))
                .andExpect(jsonPath("$.missing").value(10))
                .andExpect(jsonPath("$.accounts.length()").value(13))
                .andExpect(jsonPath("$.accounts[0].name").value("Alpha"))
                .andExpect(jsonPath("$.accounts[0].balance").value(0))
                .andExpect(jsonPath("$.accounts[0].date").value("2026-01-31"))
                .andExpect(jsonPath("$.accounts[1].balance").value(75.35))
                .andExpect(jsonPath("$.accounts[1].date").value("2025-12-31"))
                .andExpect(jsonPath("$.accounts[2].type").value("PENSION"))
                .andExpect(jsonPath("$.accounts[3].balance").isEmpty());
        mvc.perform(get("/api/dashboard/current-situation?month=2025-11"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.total").value(124.90))
                .andExpect(jsonPath("$.missing").value(11))
                .andExpect(jsonPath("$.accounts[0].balance").isEmpty())
                .andExpect(jsonPath("$.accounts[1].balance").value(100.25));
        mvc.perform(get("/api/dashboard/current-situation?month=2025-12"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.total").value(1000))
                .andExpect(jsonPath("$.accounts[0].balance").value(900));
        mvc.perform(get("/api/dashboard/allocation?month=2026-01"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.total").value(100))
                .andExpect(jsonPath("$.groups[?(@.type == 'INVESTMENT')].percentage")
                        .value(org.hamcrest.Matchers.contains(75.35)));
        mvc.perform(get("/api/dashboard/allocation?month=2025-11"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.total").value(124.90));
    }

    @Test
    void monthlyMetricsReflectNewEntriesImmediatelyAndKeepHistoricalMonthsSeparate() throws Exception {
        UUID income = category("Income", "INCOME");
        transaction(new TransactionSeed(income, "INCOME", "2025-12-31", "50.00"));
        mvc.perform(get("/api/dashboard/income?month=2025-12"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.amount").value(50));
        transaction(new TransactionSeed(income, "INCOME", "2025-12-15", "25.00"));
        mvc.perform(get("/api/dashboard/income?month=2025-12"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.amount").value(75))
                .andExpect(jsonPath("$.transactionCount").value(2));
        mvc.perform(get("/api/dashboard/income?month=2026-01"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.amount").value(0));
    }

    @Test
    void accountWithoutAnySnapshotStaysMissingInTheCurrentSituation() throws Exception {
        account("Missing", "PENSION");
        mvc.perform(get("/api/dashboard/current-situation?month=2026-01"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.total").isEmpty())
                .andExpect(jsonPath("$.missing").value(1))
                .andExpect(jsonPath("$.accounts[0].balance").isEmpty());
    }

    @Test
    void wealthHistoryIncludesEachAccountTypeWithoutCarryingMissingMonthlySnapshots() throws Exception {
        UUID cash = account("Cash one", "CASH");
        account("Cash two", "CASH");
        UUID fund = account("Fund", "INVESTMENT");
        account("Pension", "PENSION");
        balance(cash, "2026-01-31", "0.00");
        balance(fund, "2026-01-31", "100.25");
        balance(fund, "2025-12-31", "90.00");
        mvc.perform(get("/api/dashboard/wealth?month=2026-01&periods=3"))
                .andDo(result -> { if (result.getResolvedException() != null) throw result.getResolvedException(); })
                .andExpect(status().isOk()).andExpect(jsonPath("$.history[2].total").value(100.25))
                .andExpect(jsonPath("$.history[2].groups[0].type").value("CASH"))
                .andExpect(jsonPath("$.history[2].groups[0].total").value(0))
                .andExpect(jsonPath("$.history[2].groups[0].partial").value(true))
                .andExpect(jsonPath("$.history[2].groups[1].total").value(100.25))
                .andExpect(jsonPath("$.history[2].groups[2].total").isEmpty())
                .andExpect(jsonPath("$.history[1].groups[0].total").isEmpty())
                .andExpect(jsonPath("$.history[0].groups[1].total").isEmpty());
    }

    @Test
    void eachMetricIncludesTwelveMonthsOfTheSelectedYearWithExactTotalsAndCounts() throws Exception {
        UUID income = category("Income", "INCOME");
        UUID expense = category("Expense", "EXPENSE");
        transaction(new TransactionSeed(income, "INCOME", "2026-01-01", "100.25"));
        transaction(new TransactionSeed(expense, "EXPENSE", "2026-01-31", "110.35"));
        transaction(new TransactionSeed(income, "INCOME", "2026-12-31", "25.00"));
        transaction(new TransactionSeed(expense, "EXPENSE", "2026-12-01", "25.00"));
        transaction(new TransactionSeed(income, "INCOME", "2025-12-31", "999.00"));
        transaction(new TransactionSeed(income, "INCOME", "2027-01-01", "999.00"));
        mvc.perform(get("/api/dashboard/cash-flow?month=2026-01"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.amount").value(-10.10))
                .andExpect(jsonPath("$.history.length()").value(12))
                .andExpect(jsonPath("$.history[0].month").value("2026-01"))
                .andExpect(jsonPath("$.history[0].amount").value(-10.10))
                .andExpect(jsonPath("$.history[1].transactionCount").value(0))
                .andExpect(jsonPath("$.history[11].month").value("2026-12"))
                .andExpect(jsonPath("$.history[11].amount").value(0))
                .andExpect(jsonPath("$.history[11].transactionCount").value(2));
        mvc.perform(get("/api/dashboard/income?month=2026-11"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.amount").value(0))
                .andExpect(jsonPath("$.history[0].amount").value(100.25))
                .andExpect(jsonPath("$.history[11].amount").value(25));
        mvc.perform(get("/api/dashboard/expenses?month=2026-01"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.history[0].amount").value(110.35));
    }

    private UUID account(String name, String type) {
        UUID id = UUID.randomUUID();
        jdbc.update("insert into accounts (id, name, type) values (?, ?, ?)", id, name, type);
        return id;
    }

    private void balance(UUID account, String date, String amount) {
        jdbc.update("insert into monthly_balances (id, account_id, balance_date, amount, currency) values (?, ?, ?, ?, 'EUR')",
                UUID.randomUUID(), account, LocalDate.parse(date), new BigDecimal(amount));
    }

    private UUID category(String name, String type) {
        UUID id = UUID.randomUUID();
        jdbc.update("insert into categories (id, name, type) values (?, ?, ?)", id, name, type);
        return id;
    }

    private record TransactionSeed(UUID category, String type, String date, String amount) {
        TransactionSeed {
            java.util.Objects.requireNonNull(category);
            java.util.Objects.requireNonNull(type);
            LocalDate.parse(date);
            if (new BigDecimal(amount).signum() <= 0) throw new IllegalArgumentException("Expected positive synthetic amount");
        }
    }

    private void transaction(TransactionSeed seed) {
        jdbc.update("insert into transactions (id, transaction_date, description, amount, currency, type, category_id) "
                + "values (?, ?, 'Synthetic', ?, 'EUR', ?, ?)", UUID.randomUUID(), LocalDate.parse(seed.date()), new BigDecimal(seed.amount()), seed.type(), seed.category());
    }
}
