package it.andrea.worthline.portfolio.internal.repository;

import it.andrea.worthline.portfolio.internal.model.Instrument;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface InstrumentRepository extends JpaRepository<Instrument, UUID>, JpaSpecificationExecutor<Instrument> {

}
