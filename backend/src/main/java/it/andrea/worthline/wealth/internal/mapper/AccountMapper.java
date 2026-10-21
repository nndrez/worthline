package it.andrea.worthline.wealth.internal.mapper;

import org.mapstruct.*;
import it.andrea.worthline.wealth.internal.dto.*;
import it.andrea.worthline.wealth.internal.model.Account;
@Mapper(componentModel = MappingConstants.ComponentModel.SPRING, unmappedTargetPolicy = ReportingPolicy.ERROR)
public interface AccountMapper {
    @Mapping(target = "id", ignore = true)
    Account create(AccountRequest request);
    @Mapping(target = "id", ignore = true)
    void update(AccountRequest request, @MappingTarget Account entity);
    AccountResponse response(Account entity);
}
