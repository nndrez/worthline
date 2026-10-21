package it.andrea.worthline.transactions.internal.model;

import it.andrea.worthline.transactions.internal.dto.CategorySearchCriteria;
import java.util.Locale;
import java.util.UUID;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;

@NoArgsConstructor(access = AccessLevel.PRIVATE)
public final class CategorySpecification {
    public static Specification<Category> withCriteria(CategorySearchCriteria criteria) {
        return nameContains(criteria.name())
                .and(hasType(criteria.type()))
                .and(hasParentId(criteria.parentId()))
                .and(onlyRoots(criteria.rootOnly()));
    }

    public static Specification<Category> nameContains(String value) {
        return (root, query, cb) -> StringUtils.hasText(value) ? cb.like(cb.lower(root.get("name")), contains(value), '\\') : cb.conjunction();
    }
    public static Specification<Category> hasType(TransactionType value) {
        return (root, query, cb) -> value == null ? cb.conjunction() : cb.equal(root.get("type"), value);
    }
    public static Specification<Category> hasParentId(UUID value) {
        return (root, query, cb) -> value == null ? cb.conjunction() : cb.equal(root.get("parentId"), value);
    }
    public static Specification<Category> onlyRoots(Boolean value) {
        return (root, query, cb) -> Boolean.TRUE.equals(value) ? cb.isNull(root.get("parentId")) : cb.conjunction();
    }

    private static String contains(String value) {
        return "%" + value.strip().toLowerCase(Locale.ROOT)
                .replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%";
    }
}
