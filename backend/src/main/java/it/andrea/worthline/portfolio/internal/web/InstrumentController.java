package it.andrea.worthline.portfolio.internal.web;

import it.andrea.worthline.portfolio.internal.dto.*;
import it.andrea.worthline.portfolio.internal.service.InstrumentService;
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
@RequestMapping("/api/instruments")
public class InstrumentController {
    private final InstrumentService service;

    @GetMapping
    public PageResponse<InstrumentResponse> getAll(
            @Valid @ModelAttribute InstrumentSearchCriteria criteria,
            @PageableDefault(size = 20, sort = "code", direction = Sort.Direction.ASC) Pageable pageable) {
        return service.getAll(criteria, pageable);
    }

    @GetMapping("/{id}")
    public InstrumentResponse get(@PathVariable UUID id) { return service.get(id); }

    @PostMapping
    public ResponseEntity<InstrumentResponse> create(@Valid @RequestBody InstrumentRequest request) {
        InstrumentResponse response = service.create(request);
        return ResponseEntity.created(URI.create("/api/instruments/" + response.id())).body(response);
    }

    @PutMapping("/{id}")
    public InstrumentResponse update(@PathVariable UUID id, @Valid @RequestBody InstrumentRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
