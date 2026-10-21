package it.andrea.worthline.wealth.internal.dto;

import it.andrea.worthline.wealth.internal.model.*;
import java.time.LocalDate;
import java.util.UUID;

public record MonthlyBalanceSearchCriteria(
        UUID accountId,
        LocalDate date,
        LocalDate from,
        LocalDate to) {}
