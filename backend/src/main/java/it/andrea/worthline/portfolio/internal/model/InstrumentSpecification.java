package it.andrea.worthline.portfolio.internal.model;

import it.andrea.worthline.portfolio.internal.dto.InstrumentSearchCriteria;
import java.util.Locale;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;

@NoArgsConstructor(access = AccessLevel.PRIVATE)
public final class InstrumentSpecification {
    public static Specification<Instrument> withCriteria(InstrumentSearchCriteria criteria) {
        return codeContains(criteria.code())
                .and(nameContains(criteria.name()))
                .and(isinContains(criteria.isin()))
                .and(tickerContains(criteria.ticker()));
    }

    public static Specification<Instrument> codeContains(String value) {
        return (root, query, cb) -> StringUtils.hasText(value) ? cb.like(cb.lower(root.get("code")), contains(value), '\\') : cb.conjunction();
    }
    public static Specification<Instrument> nameContains(String value) {
        return (root, query, cb) -> StringUtils.hasText(value) ? cb.like(cb.lower(root.get("name")), contains(value), '\\') : cb.conjunction();
    }
    public static Specification<Instrument> isinContains(String value) {
        return (root, query, cb) -> StringUtils.hasText(value) ? cb.like(cb.lower(root.get("isin")), contains(value), '\\') : cb.conjunction();
    }
    public static Specification<Instrument> tickerContains(String value) {
        return (root, query, cb) -> StringUtils.hasText(value) ? cb.like(cb.lower(root.get("ticker")), contains(value), '\\') : cb.conjunction();
    }

    private static String contains(String value) {
        return "%" + value.strip().toLowerCase(Locale.ROOT)
                .replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%";
    }
}
