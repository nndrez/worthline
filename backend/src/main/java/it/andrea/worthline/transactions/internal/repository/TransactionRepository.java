package it.andrea.worthline.transactions.internal.repository;

import it.andrea.worthline.transactions.internal.model.Transaction;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface TransactionRepository extends JpaRepository<Transaction, UUID>, JpaSpecificationExecutor<Transaction> {
    boolean existsByCategoryId(UUID categoryId);
}
