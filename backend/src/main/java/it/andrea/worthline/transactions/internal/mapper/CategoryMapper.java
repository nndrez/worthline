package it.andrea.worthline.transactions.internal.mapper;

import org.mapstruct.*;
import it.andrea.worthline.transactions.internal.dto.*;
import it.andrea.worthline.transactions.internal.model.Category;
@Mapper(componentModel = MappingConstants.ComponentModel.SPRING, unmappedTargetPolicy = ReportingPolicy.ERROR)
public interface CategoryMapper {
    @Mapping(target = "id", ignore = true)
    Category create(CategoryRequest request);
    @Mapping(target = "id", ignore = true)
    void update(CategoryRequest request, @MappingTarget Category entity);
    CategoryResponse response(Category entity);
}
