package it.andrea.worthline.transactions.internal.repository;

import it.andrea.worthline.transactions.internal.model.Category;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface CategoryRepository extends JpaRepository<Category, UUID>, JpaSpecificationExecutor<Category> {
    boolean existsByParentId(UUID parentId);
}
