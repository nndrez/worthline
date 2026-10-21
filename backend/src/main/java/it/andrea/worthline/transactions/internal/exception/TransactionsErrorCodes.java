package it.andrea.worthline.transactions.internal.exception;

import it.andrea.worthline.core.ErrorDefinition;
import it.andrea.worthline.core.FailureKind;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum TransactionsErrorCodes implements ErrorDefinition {
    CATEGORY_IN_USE("category.in.use", FailureKind.CONFLICT, "Category has subcategories or transactions"),
    CATEGORY_NOT_FOUND("category.not.found", FailureKind.NOT_FOUND, "Category not found"),
    CATEGORY_STRUCTURE_IMMUTABLE("category.structure.immutable", FailureKind.CONFLICT, "Category type and parent cannot be changed; create a new category instead"),
    CATEGORY_TYPE_MISMATCH("category.type.mismatch", FailureKind.BUSINESS_RULE, "Category and transaction types must match"),
    INVALID_CATEGORY_PARENT("category.parent.invalid", FailureKind.BUSINESS_RULE, "Parent must be a root category of the same transaction type"),
    INVALID_DATE_RANGE("transactions.date.range.invalid", FailureKind.BUSINESS_RULE, "Start date must not follow end date"),
    TRANSACTION_NOT_FOUND("transaction.not.found", FailureKind.NOT_FOUND, "Resource not found");

    private final String errorCode;
    private final FailureKind kind;
    private final String defaultMessage;
}
