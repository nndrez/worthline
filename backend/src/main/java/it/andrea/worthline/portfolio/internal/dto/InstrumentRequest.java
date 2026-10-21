package it.andrea.worthline.portfolio.internal.dto;

import jakarta.validation.constraints.*;
import it.andrea.worthline.portfolio.internal.model.*;
public record InstrumentRequest(
        @NotBlank @Pattern(regexp = "[A-Z0-9][A-Z0-9._-]{0,31}") String code,
        @NotBlank @Size(max = 255) String name,
        @Pattern(regexp = "[A-Z]{2}[A-Z0-9]{9}[0-9]") String isin,
        @Size(max = 32) String ticker) {}
