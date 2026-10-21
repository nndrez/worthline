package it.andrea.worthline.wealth.internal.exception;

import it.andrea.worthline.core.ErrorDefinition;
import it.andrea.worthline.core.FailureKind;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum WealthErrorCodes implements ErrorDefinition {
    INVALID_DATE_RANGE("wealth.date.range.invalid", FailureKind.BUSINESS_RULE, "Start date must not follow end date"),
    ACCOUNT_IN_USE("account.in.use", FailureKind.CONFLICT, "Account has monthly balances"),
    ACCOUNT_NOT_FOUND("account.not.found", FailureKind.NOT_FOUND, "Account not found"),
    BALANCE_DATE_NOT_MONTH_END("balance.date.not.month.end", FailureKind.BUSINESS_RULE, "Balance date must be the last day of its month"),
    MONTHLY_BALANCE_NOT_FOUND("monthly.balance.not.found", FailureKind.NOT_FOUND, "Resource not found");

    private final String errorCode;
    private final FailureKind kind;
    private final String defaultMessage;
}
