package it.andrea.worthline.wealth.internal.repository;

import it.andrea.worthline.wealth.internal.model.Account;
import java.util.UUID;
import java.util.List;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface AccountRepository extends JpaRepository<Account, UUID>, JpaSpecificationExecutor<Account> {
    interface TypeCount {
        String getType();
        long getCount();
    }

    @Query("select cast(a.type as string) as type, count(a) as count from Account a group by a.type order by a.type")
    List<TypeCount> countsByType();
}

