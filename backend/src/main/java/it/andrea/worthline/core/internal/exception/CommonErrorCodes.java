package it.andrea.worthline.core.internal.exception;

import it.andrea.worthline.core.ErrorDefinition;
import it.andrea.worthline.core.FailureKind;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum CommonErrorCodes implements ErrorDefinition {
    INVALID_INPUT("common.request.invalid", FailureKind.BAD_REQUEST, "Malformed or invalid request"),
    RESOURCE_CONFLICT("common.resource.conflict", FailureKind.CONFLICT, "Duplicate resource or resource still in use"),
    HTTP_ERROR("common.http.error", FailureKind.BAD_REQUEST, "Request could not be processed"),
    INTERNAL_ERROR("common.internal.error", FailureKind.INTERNAL_ERROR, "An unexpected error occurred");

    private final String errorCode;
    private final FailureKind kind;
    private final String defaultMessage;
}
