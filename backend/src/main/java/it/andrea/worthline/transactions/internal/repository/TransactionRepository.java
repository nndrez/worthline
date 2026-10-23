package it.andrea.worthline.transactions.internal.repository;

import it.andrea.worthline.transactions.internal.model.Transaction;
import java.util.UUID;
import java.util.List;
import java.math.BigDecimal;
import java.time.LocalDate;
import it.andrea.worthline.transactions.internal.model.TransactionType;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface TransactionRepository extends JpaRepository<Transaction, UUID>, JpaSpecificationExecutor<Transaction> {
    boolean existsByCategoryId(UUID categoryId);

    interface MonthlyTotal {
        int getMonth();
        BigDecimal getAmount();
        long getTransactionCount();
    }

    @Query("select month(t.date) as month, coalesce(sum(t.amount), 0) as amount, count(t) as transactionCount "
            + "from Transaction t where t.date between :from and :to and t.type = :type group by month(t.date) order by month(t.date)")
    List<MonthlyTotal> monthlyTotals(LocalDate from, LocalDate to, TransactionType type);

    @Query("select month(t.date) as month, coalesce(sum(case when t.type = it.andrea.worthline.transactions.internal.model.TransactionType.INCOME "
            + "then t.amount else -t.amount end), 0) as amount, count(t) as transactionCount "
            + "from Transaction t where t.date between :from and :to group by month(t.date) order by month(t.date)")
    List<MonthlyTotal> monthlyCashFlow(LocalDate from, LocalDate to);
}
