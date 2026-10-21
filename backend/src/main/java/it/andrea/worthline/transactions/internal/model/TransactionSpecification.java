package it.andrea.worthline.transactions.internal.model;

import it.andrea.worthline.transactions.internal.dto.TransactionSearchCriteria;
import java.time.LocalDate;
import java.util.Locale;
import java.util.UUID;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;

@NoArgsConstructor(access = AccessLevel.PRIVATE)
public final class TransactionSpecification {
    public static Specification<Transaction> withCriteria(TransactionSearchCriteria criteria) {
        return fromDate(criteria.from())
                .and(toDate(criteria.to()))
                .and(hasType(criteria.type()))
                .and(hasCategoryId(criteria.categoryId()))
                .and(descriptionContains(criteria.description()))
                .and(tagContains(criteria.tag()));
    }

    public static Specification<Transaction> fromDate(LocalDate value) {
        return (root, query, cb) -> value == null ? cb.conjunction() : cb.greaterThanOrEqualTo(root.get("date"), value);
    }
    public static Specification<Transaction> toDate(LocalDate value) {
        return (root, query, cb) -> value == null ? cb.conjunction() : cb.lessThanOrEqualTo(root.get("date"), value);
    }
    public static Specification<Transaction> hasType(TransactionType value) {
        return (root, query, cb) -> value == null ? cb.conjunction() : cb.equal(root.get("type"), value);
    }
    public static Specification<Transaction> hasCategoryId(UUID value) {
        return (root, query, cb) -> value == null ? cb.conjunction() : cb.equal(root.get("categoryId"), value);
    }
    public static Specification<Transaction> descriptionContains(String value) {
        return (root, query, cb) -> StringUtils.hasText(value) ? cb.like(cb.lower(root.get("description")), contains(value), '\\') : cb.conjunction();
    }
    public static Specification<Transaction> tagContains(String value) {
        return (root, query, cb) -> StringUtils.hasText(value) ? cb.like(cb.lower(root.get("tag")), contains(value), '\\') : cb.conjunction();
    }

    private static String contains(String value) {
        return "%" + value.strip().toLowerCase(Locale.ROOT)
                .replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%";
    }
}
