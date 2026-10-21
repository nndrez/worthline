package it.andrea.worthline.transactions.internal.service;

import it.andrea.worthline.transactions.internal.exception.ModuleException;
import it.andrea.worthline.transactions.internal.dto.*;
import it.andrea.worthline.transactions.internal.mapper.TransactionMapper;
import it.andrea.worthline.transactions.internal.model.*;
import it.andrea.worthline.transactions.internal.repository.*;
import it.andrea.worthline.transactions.internal.exception.TransactionsErrorCodes;
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
public class TransactionService {
    private final TransactionRepository repository;
    private final TransactionMapper mapper;
    private final CategoryRepository categories;

    public TransactionResponse get(UUID id) { return mapper.response(require(id)); }

    @Transactional
    public TransactionResponse create(TransactionRequest request) {
        validate(request);
        Transaction entity = mapper.create(request);
        entity.setId(UUID.randomUUID());
        entity.setAmount(Money.euros(request.amount()).amount());
        entity.setDescription(request.description().strip());
        return mapper.response(repository.saveAndFlush(entity));
    }

    @Transactional
    public TransactionResponse update(UUID id, TransactionRequest request) {
        Transaction entity = require(id);

        validate(request);
        mapper.update(request, entity);
        entity.setAmount(Money.euros(request.amount()).amount());
        entity.setDescription(request.description().strip());
        return mapper.response(repository.saveAndFlush(entity));
    }

    @Transactional
    public void delete(UUID id) {
        Transaction entity = require(id);

        repository.delete(entity);
        repository.flush();
    }

    private Transaction require(UUID id) {
        return repository.findById(id).orElseThrow(() -> new ModuleException(TransactionsErrorCodes.TRANSACTION_NOT_FOUND));
    }

    private void validate(TransactionRequest request) {
        Category category = categories.findById(request.categoryId()).orElseThrow(() ->
                new ModuleException(TransactionsErrorCodes.CATEGORY_NOT_FOUND));
        if (category.getType() != request.type()) {
            throw new ModuleException(TransactionsErrorCodes.CATEGORY_TYPE_MISMATCH);
        }
    }

    public PageResponse<TransactionResponse> getAll(TransactionSearchCriteria criteria, Pageable pageable) {
        if (criteria.from() != null && criteria.to() != null && criteria.from().isAfter(criteria.to())) {
            throw new ModuleException(TransactionsErrorCodes.INVALID_DATE_RANGE);
        }
        Pageable stablePageable = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(),
                pageable.getSort().and(Sort.by("id")));
        return PageResponse.fromPage(repository.findAll(TransactionSpecification.withCriteria(criteria), stablePageable)
                .map(mapper::response));
    }
}
