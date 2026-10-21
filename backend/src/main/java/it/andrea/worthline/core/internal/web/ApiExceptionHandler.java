package it.andrea.worthline.core.internal.web;

import it.andrea.worthline.core.ApplicationFailure;
import it.andrea.worthline.core.ErrorDefinition;
import it.andrea.worthline.core.internal.exception.CommonErrorCodes;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.core.PropertyReferenceException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.ErrorResponse;
import java.util.List;
import java.util.UUID;

@Slf4j
@RestControllerAdvice
public class ApiExceptionHandler {

    public record FieldError(String field, String message) {}
    public record ApiError(String errorCode, String message, List<FieldError> fields, String requestId) {}

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<ApiError> validation(MethodArgumentNotValidException failure) {
        List<FieldError> fields = failure.getBindingResult().getFieldErrors().stream()
                .map(error -> new FieldError(error.getField(), error.getDefaultMessage())).toList();
        return ResponseEntity.badRequest().body(new ApiError(CommonErrorCodes.INVALID_INPUT.getErrorCode(),
                CommonErrorCodes.INVALID_INPUT.getDefaultMessage(), fields, null));
    }

    @ExceptionHandler({HttpMessageNotReadableException.class, MethodArgumentTypeMismatchException.class,
            ConstraintViolationException.class, PropertyReferenceException.class})
    ResponseEntity<ApiError> malformed(Exception failure) {
        return response(HttpStatus.BAD_REQUEST, CommonErrorCodes.INVALID_INPUT);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    ResponseEntity<ApiError> integrity(DataIntegrityViolationException failure) {
        return response(HttpStatus.CONFLICT, CommonErrorCodes.RESOURCE_CONFLICT);
    }

    @ExceptionHandler(Exception.class)
    ResponseEntity<ApiError> failure(Exception failure, HttpServletRequest request) {
        if (failure instanceof ApplicationFailure expected) {
            ErrorDefinition definition = expected.getErrorDefinition();
            HttpStatus status = switch (definition.getKind()) {
                case BAD_REQUEST -> HttpStatus.BAD_REQUEST;
                case NOT_FOUND -> HttpStatus.NOT_FOUND;
                case CONFLICT -> HttpStatus.CONFLICT;
                case BUSINESS_RULE -> HttpStatus.UNPROCESSABLE_CONTENT;
                case INTERNAL_ERROR -> HttpStatus.INTERNAL_SERVER_ERROR;
            };
            return response(status, definition);
        }
        if (failure instanceof ErrorResponse error) {
            return ResponseEntity.status(error.getStatusCode()).body(new ApiError(
                    CommonErrorCodes.HTTP_ERROR.getErrorCode(), CommonErrorCodes.HTTP_ERROR.getDefaultMessage(), List.of(), null));
        }
        String requestId = UUID.randomUUID().toString();
        // Do not log exception messages: persistence failures may contain financial data.
        log.error("Unexpected failure requestId={} method={} exceptionType={}",
                requestId, request.getMethod(), failure.getClass().getName());
        return ResponseEntity.internalServerError().body(new ApiError(
                CommonErrorCodes.INTERNAL_ERROR.getErrorCode(), CommonErrorCodes.INTERNAL_ERROR.getDefaultMessage(), List.of(), requestId));
    }

    private ResponseEntity<ApiError> response(HttpStatus status, ErrorDefinition definition) {
        return ResponseEntity.status(status).body(new ApiError(
                definition.getErrorCode(), definition.getDefaultMessage(), List.of(), null));
    }
}
