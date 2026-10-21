package it.andrea.worthline.transactions.internal.service;

import it.andrea.worthline.transactions.internal.exception.ModuleException;
import it.andrea.worthline.transactions.internal.dto.*;
import it.andrea.worthline.transactions.internal.mapper.CategoryMapper;
import it.andrea.worthline.transactions.internal.model.*;
import it.andrea.worthline.transactions.internal.repository.*;
import it.andrea.worthline.transactions.internal.exception.TransactionsErrorCodes;
import java.util.UUID;
import java.util.Objects;
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
public class CategoryService {
    private final CategoryRepository repository;
    private final CategoryMapper mapper;
    private final TransactionRepository transactions;

    public CategoryResponse get(UUID id) { return mapper.response(require(id)); }

    @Transactional
    public CategoryResponse create(CategoryRequest request) {
        validate(request);
        Category entity = mapper.create(request);
        entity.setId(UUID.randomUUID());

        entity.setName(request.name().strip());
        return mapper.response(repository.saveAndFlush(entity));
    }

    @Transactional
    public CategoryResponse update(UUID id, CategoryRequest request) {
        Category entity = require(id);
        if (entity.getType() != request.type() || !Objects.equals(entity.getParentId(), request.parentId())) {
            throw new ModuleException(TransactionsErrorCodes.CATEGORY_STRUCTURE_IMMUTABLE);
        }
        validate(request);
        mapper.update(request, entity);

        entity.setName(request.name().strip());
        return mapper.response(repository.saveAndFlush(entity));
    }

    @Transactional
    public void delete(UUID id) {
        Category entity = require(id);
        if (repository.existsByParentId(id) || transactions.existsByCategoryId(id)) {
            throw new ModuleException(TransactionsErrorCodes.CATEGORY_IN_USE);
        }
        repository.delete(entity);
        repository.flush();
    }

    private Category require(UUID id) {
        return repository.findById(id).orElseThrow(() -> new ModuleException(TransactionsErrorCodes.CATEGORY_NOT_FOUND));
    }

    private void validate(CategoryRequest request) {
        if (request.parentId() != null) {
            Category parent = require(request.parentId());
            if (parent.getParentId() != null || parent.getType() != request.type()) {
                throw new ModuleException(TransactionsErrorCodes.INVALID_CATEGORY_PARENT);
            }
        }
    }

    public PageResponse<CategoryResponse> getAll(CategorySearchCriteria criteria, Pageable pageable) {
        Pageable stablePageable = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(),
                pageable.getSort().and(Sort.by("id")));
        return PageResponse.fromPage(repository.findAll(CategorySpecification.withCriteria(criteria), stablePageable)
                .map(mapper::response));
    }
}
