package it.andrea.worthline.portfolio.internal.repository;

import it.andrea.worthline.portfolio.internal.model.Operation;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface OperationRepository extends JpaRepository<Operation, UUID>, JpaSpecificationExecutor<Operation> {
    interface Totals {
        long getOperationCount();
        java.math.BigDecimal getPurchases();
        java.math.BigDecimal getSales();
        java.math.BigDecimal getDividends();
        java.math.BigDecimal getQuantity();
    }
    @org.springframework.data.jpa.repository.Query("""
        select count(o) as operationCount,
          coalesce(sum(case when o.type = it.andrea.worthline.portfolio.internal.model.OperationType.BUY then o.amount else 0 end), 0) as purchases,
          coalesce(sum(case when o.type = it.andrea.worthline.portfolio.internal.model.OperationType.SELL then o.amount else 0 end), 0) as sales,
          coalesce(sum(case when o.type = it.andrea.worthline.portfolio.internal.model.OperationType.DIVIDEND then o.amount else 0 end), 0) as dividends,
          coalesce(sum(case when o.type = it.andrea.worthline.portfolio.internal.model.OperationType.BUY then o.quantity when o.type = it.andrea.worthline.portfolio.internal.model.OperationType.SELL then -o.quantity else 0 end), 0) as quantity
        from Operation o where o.instrumentId = :instrumentId
        """)
    Totals totals(UUID instrumentId);

    boolean existsByInstrumentId(UUID instrumentId);
}
