package it.andrea.worthline.portfolio.internal.service;

import it.andrea.worthline.portfolio.internal.exception.ModuleException;
import it.andrea.worthline.portfolio.internal.dto.*;
import it.andrea.worthline.portfolio.internal.mapper.OperationMapper;
import it.andrea.worthline.portfolio.internal.model.*;
import it.andrea.worthline.portfolio.internal.repository.*;
import it.andrea.worthline.portfolio.internal.exception.PortfolioErrorCodes;
import it.andrea.worthline.core.Money;
import java.util.UUID;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;
import it.andrea.worthline.core.PageResponse;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.transaction.annotation.Transactional;

@RequiredArgsConstructor
@Service
@Transactional(readOnly = true)
public class OperationService {
    private final OperationRepository repository;
    private final OperationMapper mapper;
    private final InstrumentRepository instruments;

    public OperationResponse get(UUID id) { return mapper.response(require(id)); }

    @Transactional
    public OperationResponse create(OperationRequest request) {
        validate(request);
        Operation entity = mapper.create(request);
        entity.setId(UUID.randomUUID());
        entity.setAmount(Money.euros(request.amount()).amount());
        return mapper.response(repository.saveAndFlush(entity));
    }

    @Transactional
    public OperationResponse update(UUID id, OperationRequest request) {
        Operation entity = require(id);

        validate(request);
        mapper.update(request, entity);
        entity.setAmount(Money.euros(request.amount()).amount());
        return mapper.response(repository.saveAndFlush(entity));
    }

    @Transactional
    public void delete(UUID id) {
        Operation entity = require(id);

        repository.delete(entity);
        repository.flush();
    }

    private Operation require(UUID id) {
        return repository.findById(id).orElseThrow(() -> new ModuleException(PortfolioErrorCodes.OPERATION_NOT_FOUND));
    }

    private void validate(OperationRequest request) {
        if (!instruments.existsById(request.instrumentId())) {
            throw new ModuleException(PortfolioErrorCodes.INSTRUMENT_NOT_FOUND);
        }
        if (request.type() != OperationType.DIVIDEND && (request.unitPrice() == null || request.quantity() == null)) {
            throw new ModuleException(PortfolioErrorCodes.TRADE_DETAILS_REQUIRED);
        }
        if (request.type() == OperationType.DIVIDEND && (request.unitPrice() != null || request.quantity() != null)) {
            throw new ModuleException(PortfolioErrorCodes.INVALID_DIVIDEND_DETAILS);
        }
    }

    public PageResponse<OperationResponse> getAll(OperationSearchCriteria criteria, Pageable pageable) {
        if (criteria.from() != null && criteria.to() != null && criteria.from().isAfter(criteria.to())) {
            throw new ModuleException(PortfolioErrorCodes.INVALID_DATE_RANGE);
        }
        Pageable stablePageable = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(),
                pageable.getSort().and(Sort.by("id")));
        return PageResponse.fromPage(repository.findAll(OperationSpecification.withCriteria(criteria), stablePageable)
                .map(mapper::response));
    }
}
