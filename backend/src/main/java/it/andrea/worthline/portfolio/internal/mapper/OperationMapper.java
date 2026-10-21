package it.andrea.worthline.portfolio.internal.mapper;

import org.mapstruct.*;
import it.andrea.worthline.portfolio.internal.dto.*;
import it.andrea.worthline.portfolio.internal.model.Operation;
@Mapper(componentModel = MappingConstants.ComponentModel.SPRING, unmappedTargetPolicy = ReportingPolicy.ERROR)
public interface OperationMapper {
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "currency", ignore = true)
    Operation create(OperationRequest request);
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "currency", ignore = true)
    void update(OperationRequest request, @MappingTarget Operation entity);
    OperationResponse response(Operation entity);
}
