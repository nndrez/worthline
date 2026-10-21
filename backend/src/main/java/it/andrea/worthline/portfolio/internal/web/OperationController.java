package it.andrea.worthline.portfolio.internal.web;

import it.andrea.worthline.portfolio.internal.dto.*;
import it.andrea.worthline.portfolio.internal.service.OperationService;
import jakarta.validation.Valid;
import java.util.UUID;
import java.net.URI;
import org.springframework.http.ResponseEntity;
import it.andrea.worthline.core.PageResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.*;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/investment-operations")
public class OperationController {
    private final OperationService service;

    @GetMapping
    public PageResponse<OperationResponse> getAll(
            @Valid @ModelAttribute OperationSearchCriteria criteria,
            @PageableDefault(size = 20, sort = "date", direction = Sort.Direction.DESC) Pageable pageable) {
        return service.getAll(criteria, pageable);
    }

    @GetMapping("/{id}")
    public OperationResponse get(@PathVariable UUID id) { return service.get(id); }

    @PostMapping
    public ResponseEntity<OperationResponse> create(@Valid @RequestBody OperationRequest request) {
        OperationResponse response = service.create(request);
        return ResponseEntity.created(URI.create("/api/investment-operations/" + response.id())).body(response);
    }

    @PutMapping("/{id}")
    public OperationResponse update(@PathVariable UUID id, @Valid @RequestBody OperationRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
