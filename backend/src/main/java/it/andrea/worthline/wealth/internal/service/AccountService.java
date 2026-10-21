package it.andrea.worthline.wealth.internal.service;

import it.andrea.worthline.wealth.internal.exception.ModuleException;
import it.andrea.worthline.wealth.internal.dto.*;
import it.andrea.worthline.wealth.internal.mapper.AccountMapper;
import it.andrea.worthline.wealth.internal.model.*;
import it.andrea.worthline.wealth.internal.repository.*;
import it.andrea.worthline.wealth.internal.exception.WealthErrorCodes;
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
public class AccountService {
    private final AccountRepository repository;
    private final AccountMapper mapper;
    private final MonthlyBalanceRepository balances;

    public AccountResponse get(UUID id) { return mapper.response(require(id)); }

    @Transactional
    public AccountResponse create(AccountRequest request) {
        Account entity = mapper.create(request);
        entity.setId(UUID.randomUUID());

        entity.setName(request.name().strip());
        return mapper.response(repository.saveAndFlush(entity));
    }

    @Transactional
    public AccountResponse update(UUID id, AccountRequest request) {
        Account entity = require(id);

        mapper.update(request, entity);

        entity.setName(request.name().strip());
        return mapper.response(repository.saveAndFlush(entity));
    }

    @Transactional
    public void delete(UUID id) {
        Account entity = require(id);
        if (balances.existsByAccountId(id)) {
            throw new ModuleException(WealthErrorCodes.ACCOUNT_IN_USE);
        }
        repository.delete(entity);
        repository.flush();
    }

    private Account require(UUID id) {
        return repository.findById(id).orElseThrow(() -> new ModuleException(WealthErrorCodes.ACCOUNT_NOT_FOUND));
    }

    public PageResponse<AccountResponse> getAll(AccountSearchCriteria criteria, Pageable pageable) {
        Pageable stablePageable = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(),
                pageable.getSort().and(Sort.by("id")));
        return PageResponse.fromPage(repository.findAll(AccountSpecification.withCriteria(criteria), stablePageable)
                .map(mapper::response));
    }
}
