package it.andrea.worthline.core;

public interface ErrorDefinition {
    String getErrorCode();
    String getDefaultMessage();
    FailureKind getKind();
}
