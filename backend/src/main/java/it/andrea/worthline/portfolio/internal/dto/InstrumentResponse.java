package it.andrea.worthline.portfolio.internal.dto;

import jakarta.validation.constraints.*;
import java.util.UUID;
import it.andrea.worthline.portfolio.internal.model.*;
public record InstrumentResponse(UUID id, String code, String name, String isin, String ticker) {}
