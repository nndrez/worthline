package it.andrea.worthline.transactions.internal.dto;

import jakarta.validation.constraints.*;
import java.util.UUID;
import it.andrea.worthline.transactions.internal.model.*;
public record CategoryResponse(UUID id, String name, TransactionType type, UUID parentId) {}
