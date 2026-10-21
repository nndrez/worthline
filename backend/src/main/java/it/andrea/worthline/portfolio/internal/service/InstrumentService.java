package it.andrea.worthline.portfolio.internal.service;

import it.andrea.worthline.portfolio.internal.exception.ModuleException;
import it.andrea.worthline.portfolio.internal.dto.*;
import it.andrea.worthline.portfolio.internal.mapper.InstrumentMapper;
import it.andrea.worthline.portfolio.internal.model.*;
import it.andrea.worthline.portfolio.internal.repository.*;
import it.andrea.worthline.portfolio.internal.exception.PortfolioErrorCodes;
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
public class InstrumentService {
    private final InstrumentRepository repository;
    private final InstrumentMapper mapper;
    private final OperationRepository operations;

    public InstrumentResponse get(UUID id) { return mapper.response(require(id)); }

    @Transactional
    public InstrumentResponse create(InstrumentRequest request) {
        Instrument entity = mapper.create(request);
        entity.setId(UUID.randomUUID());

        entity.setName(request.name().strip());
        return mapper.response(repository.saveAndFlush(entity));
    }

    @Transactional
    public InstrumentResponse update(UUID id, InstrumentRequest request) {
        Instrument entity = require(id);

        mapper.update(request, entity);

        entity.setName(request.name().strip());
        return mapper.response(repository.saveAndFlush(entity));
    }

    @Transactional
    public void delete(UUID id) {
        Instrument entity = require(id);
        if (operations.existsByInstrumentId(id)) {
            throw new ModuleException(PortfolioErrorCodes.INSTRUMENT_IN_USE);
        }
        repository.delete(entity);
        repository.flush();
    }

    private Instrument require(UUID id) {
        return repository.findById(id).orElseThrow(() -> new ModuleException(PortfolioErrorCodes.INSTRUMENT_NOT_FOUND));
    }

    public PageResponse<InstrumentResponse> getAll(InstrumentSearchCriteria criteria, Pageable pageable) {
        Pageable stablePageable = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(),
                pageable.getSort().and(Sort.by("id")));
        return PageResponse.fromPage(repository.findAll(InstrumentSpecification.withCriteria(criteria), stablePageable)
                .map(mapper::response));
    }
}
