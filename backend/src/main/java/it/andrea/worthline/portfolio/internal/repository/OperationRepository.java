package it.andrea.worthline.portfolio.internal.repository;

import it.andrea.worthline.portfolio.internal.model.Operation;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface OperationRepository extends JpaRepository<Operation, UUID>, JpaSpecificationExecutor<Operation> {
    boolean existsByInstrumentId(UUID instrumentId);
}
