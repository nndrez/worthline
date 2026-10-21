package it.andrea.worthline.wealth.internal.model;

import it.andrea.worthline.wealth.internal.dto.AccountSearchCriteria;
import java.util.Locale;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;

@NoArgsConstructor(access = AccessLevel.PRIVATE)
public final class AccountSpecification {
    public static Specification<Account> withCriteria(AccountSearchCriteria criteria) {
        return nameContains(criteria.name())
                .and(hasType(criteria.type()));
    }

    public static Specification<Account> nameContains(String value) {
        return (root, query, cb) -> StringUtils.hasText(value) ? cb.like(cb.lower(root.get("name")), contains(value), '\\') : cb.conjunction();
    }
    public static Specification<Account> hasType(AccountType value) {
        return (root, query, cb) -> value == null ? cb.conjunction() : cb.equal(root.get("type"), value);
    }

    private static String contains(String value) {
        return "%" + value.strip().toLowerCase(Locale.ROOT)
                .replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%";
    }
}
