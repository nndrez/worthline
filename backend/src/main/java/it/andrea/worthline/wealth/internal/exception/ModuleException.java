package it.andrea.worthline.wealth.internal.exception;

import it.andrea.worthline.core.ApplicationFailure;
import it.andrea.worthline.wealth.internal.exception.WealthErrorCodes;
import lombok.Getter;

@Getter
public class ModuleException extends RuntimeException implements ApplicationFailure {
    private final WealthErrorCodes errorDefinition;

    public ModuleException(WealthErrorCodes errorDefinition) {
        super(errorDefinition.getDefaultMessage());
        this.errorDefinition = errorDefinition;
    }
}
