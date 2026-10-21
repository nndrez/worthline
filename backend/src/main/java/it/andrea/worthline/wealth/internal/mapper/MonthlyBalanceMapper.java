package it.andrea.worthline.wealth.internal.mapper;

import org.mapstruct.*;
import it.andrea.worthline.wealth.internal.dto.*;
import it.andrea.worthline.wealth.internal.model.MonthlyBalance;
@Mapper(componentModel = MappingConstants.ComponentModel.SPRING, unmappedTargetPolicy = ReportingPolicy.ERROR)
public interface MonthlyBalanceMapper {
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "currency", ignore = true)
    MonthlyBalance create(MonthlyBalanceRequest request);
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "currency", ignore = true)
    void update(MonthlyBalanceRequest request, @MappingTarget MonthlyBalance entity);
    MonthlyBalanceResponse response(MonthlyBalance entity);
}
