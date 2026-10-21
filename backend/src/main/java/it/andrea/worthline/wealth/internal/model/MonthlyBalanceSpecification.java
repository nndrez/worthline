package it.andrea.worthline.wealth.internal.model;

import it.andrea.worthline.wealth.internal.dto.MonthlyBalanceSearchCriteria;
import java.time.LocalDate;
import java.util.UUID;
import org.springframework.data.jpa.domain.Specification;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;

@NoArgsConstructor(access = AccessLevel.PRIVATE)
public final class MonthlyBalanceSpecification {
    public static Specification<MonthlyBalance> withCriteria(MonthlyBalanceSearchCriteria criteria) {
        return hasAccountId(criteria.accountId())
                .and(hasDate(criteria.date()))
                .and(fromDate(criteria.from()))
                .and(toDate(criteria.to()));
    }

    public static Specification<MonthlyBalance> hasAccountId(UUID value) {
        return (root, query, cb) -> value == null ? cb.conjunction() : cb.equal(root.get("accountId"), value);
    }
    public static Specification<MonthlyBalance> hasDate(LocalDate value) {
        return (root, query, cb) -> value == null ? cb.conjunction() : cb.equal(root.get("date"), value);
    }
    public static Specification<MonthlyBalance> fromDate(LocalDate value) {
        return (root, query, cb) -> value == null ? cb.conjunction() : cb.greaterThanOrEqualTo(root.get("date"), value);
    }
    public static Specification<MonthlyBalance> toDate(LocalDate value) {
        return (root, query, cb) -> value == null ? cb.conjunction() : cb.lessThanOrEqualTo(root.get("date"), value);
    }
}
