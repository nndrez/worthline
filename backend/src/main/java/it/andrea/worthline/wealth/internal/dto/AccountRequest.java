package it.andrea.worthline.wealth.internal.dto;

import jakarta.validation.constraints.*;
import it.andrea.worthline.wealth.internal.model.*;
public record AccountRequest(
        @NotBlank @Size(max = 100) String name,
        @NotNull AccountType type) {}
