package it.andrea.worthline;

import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.postgresql.PostgreSQLContainer;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Import(BaseModulesIntegrationTests.Database.class)
class BaseModulesIntegrationTests {
    @TestConfiguration(proxyBeanMethods = false)
    static class Database {
        @Bean
        @ServiceConnection
        PostgreSQLContainer postgres() {
            return new PostgreSQLContainer("postgres:17-alpine");
        }
    }

    @Autowired MockMvc mvc;
    @Autowired JdbcTemplate jdbc;

    @BeforeEach
    void clearSyntheticData() {
        jdbc.execute("TRUNCATE transactions, categories, monthly_balances, accounts, investment_operations, instruments CASCADE");
    }

    @Test
    void dynamicCategoriesSupportTwoLevelsAndSafeDeletion() throws Exception {
        String root = create("/api/categories", """
                {"name":"Food","type":"EXPENSE"}
                """);
        String child = create("/api/categories", """
                {"name":"Groceries","type":"EXPENSE","parentId":"%s"}
                """.formatted(root));
        mvc.perform(post("/api/categories").contentType(MediaType.APPLICATION_JSON).content("""
                {"name":"Third level","type":"EXPENSE","parentId":"%s"}
                """.formatted(child))).andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.errorCode").value("category.parent.invalid"));
        mvc.perform(delete("/api/categories/" + root)).andExpect(status().isConflict());
        mvc.perform(put("/api/categories/" + child).contentType(MediaType.APPLICATION_JSON).content("""
                {"name":"Supermarket","type":"EXPENSE","parentId":"%s"}
                """.formatted(root))).andExpect(status().isOk()).andExpect(jsonPath("$.name").value("Supermarket"));
        mvc.perform(delete("/api/categories/" + child)).andExpect(status().isNoContent());
        mvc.perform(delete("/api/categories/" + root)).andExpect(status().isNoContent());
    }

    @Test
    void duplicatesAreScopedByTypeAndParentAndIgnoreNameCase() throws Exception {
        create("/api/categories", """ 
                {"name":"Food","type":"EXPENSE"}
                """);
        mvc.perform(post("/api/categories").contentType(MediaType.APPLICATION_JSON).content("""
                {"name":" food ","type":"EXPENSE"}
                """ )).andExpect(status().isConflict()).andExpect(jsonPath("$.errorCode").value("common.resource.conflict"));
        create("/api/categories", """
                {"name":"Food","type":"INCOME"}
                """);
    }

    @Test
    void transactionsDoNotRequireAnAccountAndCannotUseOppositeCategoryType() throws Exception {
        String category = expenseCategory();
        String id = create("/api/transactions", transaction(category, "12.34"));
        mvc.perform(get("/api/transactions/" + id)).andExpect(status().isOk())
                .andExpect(jsonPath("$.currency").value("EUR"))
                .andExpect(jsonPath("$.amount").value(12.34))
                .andExpect(jsonPath("$.accountId").doesNotExist());
        mvc.perform(delete("/api/categories/" + category)).andExpect(status().isConflict());
        mvc.perform(post("/api/transactions").contentType(MediaType.APPLICATION_JSON)
                .content(transaction(category, "12.34").replace("EXPENSE", "INCOME")))
                .andExpect(status().isUnprocessableEntity()).andExpect(jsonPath("$.errorCode").value("category.type.mismatch"));
        mvc.perform(put("/api/transactions/" + id).contentType(MediaType.APPLICATION_JSON)
                .content(transaction(category, "20.10"))).andExpect(status().isOk())
                .andExpect(jsonPath("$.amount").value(20.10));
        mvc.perform(delete("/api/transactions/" + id)).andExpect(status().isNoContent());
        mvc.perform(delete("/api/categories/" + category)).andExpect(status().isNoContent());
    }

    @Test
    void malformedRequestsAndInvalidMoneyHaveSafeFieldErrors() throws Exception {
        String category = expenseCategory();
        mvc.perform(post("/api/transactions").contentType(MediaType.APPLICATION_JSON)
                .content(transaction(category, "0"))).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fields[0].field").value("amount"));
        mvc.perform(post("/api/transactions").contentType(MediaType.APPLICATION_JSON)
                .content(transaction(category, "1.001"))).andExpect(status().isBadRequest());
        mvc.perform(post("/api/transactions").contentType(MediaType.APPLICATION_JSON)
                .content("{" )).andExpect(status().isBadRequest()).andExpect(jsonPath("$.errorCode").value("common.request.invalid"));
        mvc.perform(get("/api/transactions/not-a-uuid")).andExpect(status().isBadRequest());
        mvc.perform(get("/api/transactions/" + UUID.randomUUID())).andExpect(status().isNotFound());
        mvc.perform(get("/api/transactions?sort=unknownField")).andExpect(status().isBadRequest());
        mvc.perform(get("/api/transactions?from=2026-02-01&to=2026-01-01"))
                .andExpect(status().isUnprocessableEntity());
    }

    @Test
    void transactionListsFilterInclusiveDatesAndHandleNullFilters() throws Exception {
        String category = expenseCategory();
        create("/api/transactions", transaction(category, "12.34"));
        mvc.perform(get("/api/transactions")).andExpect(status().isOk()).andExpect(jsonPath("$.content.length()").value(1));
        mvc.perform(get("/api/transactions?from=2026-01-15&to=2026-01-15"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.content.length()").value(1));
        mvc.perform(get("/api/transactions?from=2026-01-16"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.content.length()").value(0));
        mvc.perform(get("/api/transactions?to=2026-01-14"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.content.length()").value(0));
    }

    @Test
    void monthlySnapshotsAreManualUniqueAndDistinguishMissingFromZero() throws Exception {
        String account = create("/api/accounts", """
                {"name":"Checking","type":"CASH"}
                """);
        mvc.perform(get("/api/monthly-balances?date=2026-01-31")).andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(0));
        String id = create("/api/monthly-balances", balance(account, "2026-01-31", "0"));
        mvc.perform(post("/api/monthly-balances").contentType(MediaType.APPLICATION_JSON)
                .content(balance(account, "2026-01-31", "5"))).andExpect(status().isConflict());
        mvc.perform(post("/api/monthly-balances").contentType(MediaType.APPLICATION_JSON)
                .content(balance(account, "2026-01-30", "5"))).andExpect(status().isUnprocessableEntity());
        create("/api/transactions", transaction(expenseCategory(), "12.34"));
        mvc.perform(get("/api/monthly-balances/" + id)).andExpect(status().isOk())
                .andExpect(jsonPath("$.amount").value(0)).andExpect(jsonPath("$.currency").value("EUR"));
        mvc.perform(put("/api/monthly-balances/" + id).contentType(MediaType.APPLICATION_JSON)
                .content(balance(account, "2026-01-31", "-15.50"))).andExpect(status().isOk())
                .andExpect(jsonPath("$.amount").value(-15.50));
        mvc.perform(delete("/api/accounts/" + account)).andExpect(status().isConflict());
        mvc.perform(delete("/api/monthly-balances/" + id)).andExpect(status().isNoContent());
        mvc.perform(delete("/api/accounts/" + account)).andExpect(status().isNoContent());
    }

    @Test
    void snapshotsAcceptLeapYearMonthEndAndRejectMissingAccounts() throws Exception {
        String account = create("/api/accounts", """
                {"name":"Pension","type":"PENSION"}
                """);
        create("/api/monthly-balances", balance(account, "2024-02-29", "1"));
        mvc.perform(post("/api/monthly-balances").contentType(MediaType.APPLICATION_JSON)
                .content(balance(account, "2024-02-28", "5"))).andExpect(status().isUnprocessableEntity());
        mvc.perform(post("/api/monthly-balances").contentType(MediaType.APPLICATION_JSON)
                .content(balance(UUID.randomUUID().toString(), "2026-01-31", "5"))).andExpect(status().isNotFound());
    }

    @Test
    void portfolioSupportsManualTradesAndDividendsWithoutChangingWealth() throws Exception {
        String instrument = create("/api/instruments", """
                {"code":"TEST","name":"Synthetic fund","isin":"IE0000000001","ticker":"TEST"}
                """);
        String trade = """
                {"instrumentId":"%s","date":"2026-01-15","type":"BUY","market":"Test exchange",
                 "broker":"Test broker","unitPrice":12.345678,"quantity":1.123456,"amount":14.01}
                """.formatted(instrument);
        String id = create("/api/investment-operations", trade);
        mvc.perform(get("/api/investment-operations/" + id)).andExpect(status().isOk())
                .andExpect(jsonPath("$.unitPrice").value(12.345678)).andExpect(jsonPath("$.currency").value("EUR"));
        create("/api/investment-operations", """
                {"instrumentId":"%s","date":"2026-01-16","type":"DIVIDEND","amount":2.34}
                """.formatted(instrument));
        mvc.perform(get("/api/investment-operations?from=2026-01-15&to=2026-01-15"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.content.length()").value(1));
        mvc.perform(get("/api/investment-operations")).andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(2));
        mvc.perform(put("/api/investment-operations/" + id).contentType(MediaType.APPLICATION_JSON)
                .content(trade.replace("BUY", "SELL"))).andExpect(status().isOk()).andExpect(jsonPath("$.type").value("SELL"));
        mvc.perform(delete("/api/instruments/" + instrument)).andExpect(status().isConflict());
        assertThat(jdbc.queryForObject("select count(*) from monthly_balances", Integer.class)).isZero();
        assertThat(jdbc.queryForObject("select count(*) from transactions", Integer.class)).isZero();
    }

    @Test
    void portfolioRejectsIncompleteTradesAndUnknownInstruments() throws Exception {
        String instrument = create("/api/instruments", """
                {"code":"TEST","name":"Synthetic fund"}
                """);
        String incomplete = """
                {"instrumentId":"%s","date":"2026-01-15","type":"BUY","amount":1}
                """.formatted(instrument);
        mvc.perform(post("/api/investment-operations").contentType(MediaType.APPLICATION_JSON).content(incomplete))
                .andExpect(status().isUnprocessableEntity()).andExpect(jsonPath("$.errorCode").value("trade.details.required"));
        mvc.perform(post("/api/investment-operations").contentType(MediaType.APPLICATION_JSON)
                .content(incomplete.replace(instrument, UUID.randomUUID().toString())))
                .andExpect(status().isNotFound());
        mvc.perform(delete("/api/instruments/" + instrument)).andExpect(status().isNoContent());
    }

    @ParameterizedTest
    @ValueSource(strings = {"categories", "transactions", "accounts", "monthly-balances", "instruments", "investment-operations"})
    void everyCollectionReturnsAPageWithMetadata(String resource) throws Exception {
        mvc.perform(get("/api/" + resource)).andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(0))
                .andExpect(jsonPath("$.page.currentPage").value(1))
                .andExpect(jsonPath("$.page.size").value(20))
                .andExpect(jsonPath("$.page.totalElements").value(0))
                .andExpect(jsonPath("$.page.totalPages").value(0))
                .andExpect(jsonPath("$.page.first").value(true))
                .andExpect(jsonPath("$.page.last").value(true));
    }

    @Test
    void accountsSupportCombinedFiltersSortingAndPageNavigation() throws Exception {
        for (String name : new String[]{"Alpha", "Beta", "Gamma"}) {
            create("/api/accounts", """
                    {"name":"%s","type":"CASH"}
                    """.formatted(name));
        }
        create("/api/accounts", """
                {"name":"Pension","type":"PENSION"}
                """);
        mvc.perform(get("/api/accounts?type=CASH&size=1&page=0&sort=name,desc"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.content[0].name").value("Gamma"))
                .andExpect(jsonPath("$.page.totalElements").value(3))
                .andExpect(jsonPath("$.page.totalPages").value(3))
                .andExpect(jsonPath("$.page.first").value(true)).andExpect(jsonPath("$.page.last").value(false));
        mvc.perform(get("/api/accounts?type=CASH&size=1&page=1&sort=name,desc"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.content[0].name").value("Beta"))
                .andExpect(jsonPath("$.page.currentPage").value(2));
        mvc.perform(get("/api/accounts?type=CASH&size=1&page=2&sort=name,desc"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.content[0].name").value("Alpha"))
                .andExpect(jsonPath("$.page.last").value(true));
        mvc.perform(get("/api/accounts?type=CASH&name=ALP"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.page.totalElements").value(1));
        mvc.perform(get("/api/accounts?page=10&size=1"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.content.length()").value(0))
                .andExpect(jsonPath("$.page.totalElements").value(4));
        mvc.perform(get("/api/accounts?size=1000"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.page.size").value(100));
    }

    @Test
    void categoriesFilterByTypeParentAndRootLevel() throws Exception {
        String root = expenseCategory();
        String child = create("/api/categories", """
                {"name":"Groceries","type":"EXPENSE","parentId":"%s"}
                """.formatted(root));
        create("/api/categories", """
                {"name":"Salary","type":"INCOME"}
                """);
        mvc.perform(get("/api/categories?type=EXPENSE&rootOnly=true"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.content[0].id").value(root))
                .andExpect(jsonPath("$.page.totalElements").value(1));
        mvc.perform(get("/api/categories?parentId=" + root + "&name=OCER"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.content[0].id").value(child))
                .andExpect(jsonPath("$.page.totalElements").value(1));
        mvc.perform(get("/api/categories?type=INVALID"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.errorCode").value("common.request.invalid"));
    }

    @Test
    void transactionsCombineDateTypeCategoryAndTextSpecifications() throws Exception {
        String category = expenseCategory();
        String id = create("/api/transactions", transaction(category, "12.34"));
        create("/api/transactions", transaction(category, "20").replace("2026-01-15", "2026-02-15"));
        mvc.perform(get("/api/transactions?from=2026-01-01&to=2026-01-31&type=EXPENSE&description=PURCHASE&tag=tes&categoryId=" + category))
                .andExpect(status().isOk()).andExpect(jsonPath("$.content[0].id").value(id))
                .andExpect(jsonPath("$.page.totalElements").value(1));
        mvc.perform(get("/api/transactions?type=INCOME"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.page.totalElements").value(0));
        mvc.perform(get("/api/transactions?from=invalid"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.errorCode").value("common.request.invalid"));
    }

    @Test
    void monthlyBalancesFilterAcrossMonthsAndAccounts() throws Exception {
        String first = create("/api/accounts", """
                {"name":"First account","type":"CASH"}
                """);
        String second = create("/api/accounts", """
                {"name":"Second account","type":"CASH"}
                """);
        create("/api/monthly-balances", balance(first, "2026-01-31", "100"));
        create("/api/monthly-balances", balance(first, "2026-02-28", "200"));
        create("/api/monthly-balances", balance(second, "2026-02-28", "300"));
        mvc.perform(get("/api/monthly-balances?accountId=" + first + "&from=2026-02-01&to=2026-02-28"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.content[0].amount").value(200))
                .andExpect(jsonPath("$.page.totalElements").value(1));
        mvc.perform(get("/api/monthly-balances?date=2026-02-28"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.page.totalElements").value(2));
        mvc.perform(get("/api/monthly-balances?date=2026-02-15"))
                .andExpect(status().isUnprocessableEntity()).andExpect(jsonPath("$.errorCode").value("balance.date.not.month.end"));
        mvc.perform(get("/api/monthly-balances?from=2026-02-28&to=2026-01-31"))
                .andExpect(status().isUnprocessableEntity()).andExpect(jsonPath("$.errorCode").value("wealth.date.range.invalid"));
    }

    @Test
    void instrumentTextSearchTreatsWildcardsAsLiteralCharacters() throws Exception {
        String instrument = create("/api/instruments", """
                {"code":"TEST","name":"Synthetic 100% fund","isin":"IE0000000001","ticker":"FUND"}
                """);
        create("/api/instruments", """
                {"code":"OTHER","name":"Synthetic 100x fund","ticker":"OTHER"}
                """);
        mvc.perform(get("/api/instruments").param("name", "100%"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.page.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].id").value(instrument));
        mvc.perform(get("/api/instruments?code=tes&ticker=und&isin=ie0000000001"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.page.totalElements").value(1));
    }

    @Test
    void investmentOperationsFilterByInstrumentTypeDateAndBroker() throws Exception {
        String instrument = create("/api/instruments", """
                {"code":"TEST","name":"Synthetic fund"}
                """);
        create("/api/investment-operations", """
                {"instrumentId":"%s","date":"2026-01-15","type":"BUY","market":"Test exchange",
                 "broker":"Test broker","unitPrice":10,"quantity":1,"amount":10}
                """.formatted(instrument));
        create("/api/investment-operations", """
                {"instrumentId":"%s","date":"2026-01-16","type":"DIVIDEND","amount":1}
                """.formatted(instrument));
        mvc.perform(get("/api/investment-operations?from=2026-01-01&to=2026-01-31&type=BUY&broker=TEST&market=exch&instrumentId=" + instrument))
                .andExpect(status().isOk()).andExpect(jsonPath("$.page.totalElements").value(1));
        mvc.perform(get("/api/investment-operations?instrumentId=" + UUID.randomUUID()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.page.totalElements").value(0));
    }

    private String expenseCategory() throws Exception {
        return create("/api/categories", """
                {"name":"Synthetic expense","type":"EXPENSE"}
                """);
    }

    private String create(String path, String body) throws Exception {
        String response = mvc.perform(post(path).contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated()).andExpect(header().exists("Location"))
                .andReturn().getResponse().getContentAsString();
        return JsonPath.read(response, "$.id");
    }

    private String transaction(String category, String amount) {
        return """
                {"date":"2026-01-15","description":"Synthetic purchase","amount":%s,
                 "type":"EXPENSE","categoryId":"%s","tag":"Test","notes":"Synthetic data"}
                """.formatted(amount, category);
    }

    private String balance(String account, String date, String amount) {
        return """
                {"accountId":"%s","date":"%s","amount":%s}
                """.formatted(account, date, amount);
    }
}
