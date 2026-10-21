package it.andrea.worthline.portfolio.internal.model;

import it.andrea.worthline.portfolio.internal.dto.OperationSearchCriteria;
import java.time.LocalDate;
import java.util.Locale;
import java.util.UUID;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;

@NoArgsConstructor(access = AccessLevel.PRIVATE)
public final class OperationSpecification {
    public static Specification<Operation> withCriteria(OperationSearchCriteria criteria) {
        return fromDate(criteria.from())
                .and(toDate(criteria.to()))
                .and(hasType(criteria.type()))
                .and(hasInstrumentId(criteria.instrumentId()))
                .and(brokerContains(criteria.broker()))
                .and(marketContains(criteria.market()));
    }

    public static Specification<Operation> fromDate(LocalDate value) {
        return (root, query, cb) -> value == null ? cb.conjunction() : cb.greaterThanOrEqualTo(root.get("date"), value);
    }
    public static Specification<Operation> toDate(LocalDate value) {
        return (root, query, cb) -> value == null ? cb.conjunction() : cb.lessThanOrEqualTo(root.get("date"), value);
    }
    public static Specification<Operation> hasType(OperationType value) {
        return (root, query, cb) -> value == null ? cb.conjunction() : cb.equal(root.get("type"), value);
    }
    public static Specification<Operation> hasInstrumentId(UUID value) {
        return (root, query, cb) -> value == null ? cb.conjunction() : cb.equal(root.get("instrumentId"), value);
    }
    public static Specification<Operation> brokerContains(String value) {
        return (root, query, cb) -> StringUtils.hasText(value) ? cb.like(cb.lower(root.get("broker")), contains(value), '\\') : cb.conjunction();
    }
    public static Specification<Operation> marketContains(String value) {
        return (root, query, cb) -> StringUtils.hasText(value) ? cb.like(cb.lower(root.get("market")), contains(value), '\\') : cb.conjunction();
    }

    private static String contains(String value) {
        return "%" + value.strip().toLowerCase(Locale.ROOT)
                .replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%";
    }
}
