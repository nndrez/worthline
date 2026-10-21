package it.andrea.worthline.wealth.internal.repository;

import it.andrea.worthline.wealth.internal.model.Account;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface AccountRepository extends JpaRepository<Account, UUID>, JpaSpecificationExecutor<Account> {

}
