package it.andrea.worthline.wealth.internal.dto;

import jakarta.validation.constraints.*;
import java.util.UUID;
import it.andrea.worthline.wealth.internal.model.*;
public record AccountResponse(UUID id, String name, AccountType type) {}
