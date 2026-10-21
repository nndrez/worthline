package it.andrea.worthline.portfolio.internal.exception;

import it.andrea.worthline.core.ApplicationFailure;
import it.andrea.worthline.portfolio.internal.exception.PortfolioErrorCodes;
import lombok.Getter;

@Getter
public class ModuleException extends RuntimeException implements ApplicationFailure {
    private final PortfolioErrorCodes errorDefinition;

    public ModuleException(PortfolioErrorCodes errorDefinition) {
        super(errorDefinition.getDefaultMessage());
        this.errorDefinition = errorDefinition;
    }
}
