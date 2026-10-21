package it.andrea.worthline.transactions.internal.exception;

import it.andrea.worthline.core.ApplicationFailure;
import it.andrea.worthline.transactions.internal.exception.TransactionsErrorCodes;
import lombok.Getter;

@Getter
public class ModuleException extends RuntimeException implements ApplicationFailure {
    private final TransactionsErrorCodes errorDefinition;

    public ModuleException(TransactionsErrorCodes errorDefinition) {
        super(errorDefinition.getDefaultMessage());
        this.errorDefinition = errorDefinition;
    }
}
