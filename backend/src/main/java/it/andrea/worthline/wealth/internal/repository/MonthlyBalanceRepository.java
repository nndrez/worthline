package it.andrea.worthline.wealth.internal.repository;

import it.andrea.worthline.wealth.internal.model.MonthlyBalance;
import java.util.UUID;
import java.util.List;
import java.time.LocalDate;
import java.math.BigDecimal;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface MonthlyBalanceRepository extends JpaRepository<MonthlyBalance, UUID>, JpaSpecificationExecutor<MonthlyBalance> {
    boolean existsByAccountId(UUID accountId);

    interface PeriodTotal {
        LocalDate getDate();
        BigDecimal getAmount();
        long getRecorded();
    }
    interface PeriodTypeTotal extends PeriodTotal {
        String getType();
    }
    interface TypeTotal {
        String getType();
        BigDecimal getAmount();
    }

    @Query("select b.date as date, sum(b.amount) as amount, count(b) as recorded "
            + "from MonthlyBalance b where b.date between :from and :to group by b.date order by b.date")
    List<PeriodTotal> totals(LocalDate from, LocalDate to);

    @Query("select b.date as date, cast(a.type as string) as type, sum(b.amount) as amount, count(b) as recorded "
            + "from MonthlyBalance b join Account a on a.id = b.accountId "
            + "where b.date between :from and :to group by b.date, a.type order by b.date, a.type")
    List<PeriodTypeTotal> totalsByType(LocalDate from, LocalDate to);

    @Query("select cast(a.type as string) as type, sum(b.amount) as amount from Account a "
            + "left join MonthlyBalance b on b.accountId = a.id "
            + "and b.date = (select max(latest.date) from MonthlyBalance latest where latest.accountId = a.id and latest.date <= :date) "
            + "group by a.type order by a.type")
    List<TypeTotal> latestAllocation(LocalDate date);

    @Query("select b from MonthlyBalance b where b.accountId in :accountIds "
            + "and b.date = (select max(latest.date) from MonthlyBalance latest where latest.accountId = b.accountId and latest.date <= :date)")
    List<MonthlyBalance> latestForAccounts(List<UUID> accountIds, LocalDate date);

}
