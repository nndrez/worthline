package it.andrea.worthline.transactions.internal.mapper;

import org.mapstruct.*;
import it.andrea.worthline.transactions.internal.dto.*;
import it.andrea.worthline.transactions.internal.model.Transaction;
@Mapper(componentModel = MappingConstants.ComponentModel.SPRING, unmappedTargetPolicy = ReportingPolicy.ERROR)
public interface TransactionMapper {
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "currency", ignore = true)
    Transaction create(TransactionRequest request);
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "currency", ignore = true)
    void update(TransactionRequest request, @MappingTarget Transaction entity);
    TransactionResponse response(Transaction entity);
}
