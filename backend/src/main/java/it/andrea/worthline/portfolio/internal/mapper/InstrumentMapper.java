package it.andrea.worthline.portfolio.internal.mapper;

import org.mapstruct.*;
import it.andrea.worthline.portfolio.internal.dto.*;
import it.andrea.worthline.portfolio.internal.model.Instrument;
@Mapper(componentModel = MappingConstants.ComponentModel.SPRING, unmappedTargetPolicy = ReportingPolicy.ERROR)
public interface InstrumentMapper {
    @Mapping(target = "id", ignore = true)
    Instrument create(InstrumentRequest request);
    @Mapping(target = "id", ignore = true)
    void update(InstrumentRequest request, @MappingTarget Instrument entity);
    InstrumentResponse response(Instrument entity);
}
