package it.andrea.worthline.core.internal.web;

import it.andrea.worthline.core.ErrorDefinition;
import it.andrea.worthline.core.internal.exception.CommonErrorCodes;
import it.andrea.worthline.portfolio.internal.exception.PortfolioErrorCodes;
import it.andrea.worthline.transactions.internal.exception.TransactionsErrorCodes;
import it.andrea.worthline.wealth.internal.exception.WealthErrorCodes;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.HttpRequestMethodNotSupportedException;

import static org.assertj.core.api.Assertions.assertThat;

class ApiExceptionHandlerTests {
    private final ApiExceptionHandler handler = new ApiExceptionHandler();

    @Test
    void translationKeysAreDottedAndGloballyUnique() {
        List<ErrorDefinition> definitions = new ArrayList<>();
        definitions.addAll(List.of(CommonErrorCodes.values()));
        definitions.addAll(List.of(TransactionsErrorCodes.values()));
        definitions.addAll(List.of(WealthErrorCodes.values()));
        definitions.addAll(List.of(PortfolioErrorCodes.values()));

        assertThat(definitions).extracting(ErrorDefinition::getErrorCode)
                .doesNotHaveDuplicates()
                .allSatisfy(key -> assertThat(key).matches("[a-z]+(?:\\.[a-z]+)+"));
    }

    @Test
    void frameworkErrorsExposeATranslationKeyAndPreserveHttpStatus() {
        ResponseEntity<ApiExceptionHandler.ApiError> response = handler.failure(
                new HttpRequestMethodNotSupportedException("PATCH"), new MockHttpServletRequest());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.METHOD_NOT_ALLOWED);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().errorCode()).isEqualTo("common.http.error");
    }

    @Test
    void unexpectedFailuresExposeATranslationKeyWithoutInternalDetails() {
        ResponseEntity<ApiExceptionHandler.ApiError> response = handler.failure(
                new IllegalStateException("Sensitive internal details"), new MockHttpServletRequest());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().errorCode()).isEqualTo("common.internal.error");
        assertThat(response.getBody().message()).doesNotContain("Sensitive internal details");
        assertThat(response.getBody().requestId()).isNotBlank();
    }
}
