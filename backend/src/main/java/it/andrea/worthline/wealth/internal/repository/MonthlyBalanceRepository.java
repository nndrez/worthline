package it.andrea.worthline.wealth.internal.repository;

import it.andrea.worthline.wealth.internal.model.MonthlyBalance;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface MonthlyBalanceRepository extends JpaRepository<MonthlyBalance, UUID>, JpaSpecificationExecutor<MonthlyBalance> {
    boolean existsByAccountId(UUID accountId);
}
