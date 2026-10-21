package it.andrea.worthline.transactions.internal.dto;

import jakarta.validation.constraints.*;
import java.util.UUID;
import it.andrea.worthline.transactions.internal.model.*;
public record CategoryRequest(
        @NotBlank @Size(max = 100) String name,
        @NotNull TransactionType type,
         UUID parentId) {}
