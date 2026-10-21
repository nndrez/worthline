package it.andrea.worthline.portfolio.internal.exception;

import it.andrea.worthline.core.ErrorDefinition;
import it.andrea.worthline.core.FailureKind;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum PortfolioErrorCodes implements ErrorDefinition {
    INSTRUMENT_IN_USE("instrument.in.use", FailureKind.CONFLICT, "Instrument has investment operations"),
    INSTRUMENT_NOT_FOUND("instrument.not.found", FailureKind.NOT_FOUND, "Instrument not found"),
    INVALID_DATE_RANGE("portfolio.date.range.invalid", FailureKind.BUSINESS_RULE, "Start date must not follow end date"),
    INVALID_DIVIDEND_DETAILS("dividend.details.invalid", FailureKind.BUSINESS_RULE, "Dividends require only a manually entered amount"),
    OPERATION_NOT_FOUND("investment.operation.not.found", FailureKind.NOT_FOUND, "Resource not found"),
    TRADE_DETAILS_REQUIRED("trade.details.required", FailureKind.BUSINESS_RULE, "Buy and sell operations require unit price and positive quantity");

    private final String errorCode;
    private final FailureKind kind;
    private final String defaultMessage;
}
