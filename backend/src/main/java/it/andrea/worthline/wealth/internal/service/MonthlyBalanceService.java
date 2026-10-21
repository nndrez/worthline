package it.andrea.worthline.wealth.internal.service;

import it.andrea.worthline.wealth.internal.exception.ModuleException;
import it.andrea.worthline.wealth.internal.dto.*;
import it.andrea.worthline.wealth.internal.mapper.MonthlyBalanceMapper;
import it.andrea.worthline.wealth.internal.model.*;
import it.andrea.worthline.wealth.internal.repository.*;
import it.andrea.worthline.wealth.internal.exception.WealthErrorCodes;
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
public class MonthlyBalanceService {
    private final MonthlyBalanceRepository repository;
    private final MonthlyBalanceMapper mapper;
    private final AccountRepository accounts;

    public MonthlyBalanceResponse get(UUID id) { return mapper.response(require(id)); }

    @Transactional
    public MonthlyBalanceResponse create(MonthlyBalanceRequest request) {
        validate(request);
        MonthlyBalance entity = mapper.create(request);
        entity.setId(UUID.randomUUID());
        entity.setAmount(Money.euros(request.amount()).amount());
        return mapper.response(repository.saveAndFlush(entity));
    }

    @Transactional
    public MonthlyBalanceResponse update(UUID id, MonthlyBalanceRequest request) {
        MonthlyBalance entity = require(id);

        validate(request);
        mapper.update(request, entity);
        entity.setAmount(Money.euros(request.amount()).amount());
        return mapper.response(repository.saveAndFlush(entity));
    }

    @Transactional
    public void delete(UUID id) {
        MonthlyBalance entity = require(id);

        repository.delete(entity);
        repository.flush();
    }

    private MonthlyBalance require(UUID id) {
        return repository.findById(id).orElseThrow(() -> new ModuleException(WealthErrorCodes.MONTHLY_BALANCE_NOT_FOUND));
    }

    private void validate(MonthlyBalanceRequest request) {
        if (!accounts.existsById(request.accountId())) {
            throw new ModuleException(WealthErrorCodes.ACCOUNT_NOT_FOUND);
        }
        if (!request.date().equals(request.date().withDayOfMonth(request.date().lengthOfMonth()))) {
            throw new ModuleException(WealthErrorCodes.BALANCE_DATE_NOT_MONTH_END);
        }
    }

    public PageResponse<MonthlyBalanceResponse> getAll(MonthlyBalanceSearchCriteria criteria, Pageable pageable) {
        if (criteria.from() != null && criteria.to() != null && criteria.from().isAfter(criteria.to())) {
            throw new ModuleException(WealthErrorCodes.INVALID_DATE_RANGE);
        }
        if (criteria.date() != null && !criteria.date().equals(criteria.date().withDayOfMonth(criteria.date().lengthOfMonth()))) {
            throw new ModuleException(WealthErrorCodes.BALANCE_DATE_NOT_MONTH_END);
        }
        Pageable stablePageable = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(),
                pageable.getSort().and(Sort.by("id")));
        return PageResponse.fromPage(repository.findAll(MonthlyBalanceSpecification.withCriteria(criteria), stablePageable)
                .map(mapper::response));
    }
}
