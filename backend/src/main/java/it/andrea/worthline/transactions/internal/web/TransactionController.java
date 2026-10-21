package it.andrea.worthline.transactions.internal.web;

import it.andrea.worthline.transactions.internal.dto.*;
import it.andrea.worthline.transactions.internal.service.TransactionService;
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
@RequestMapping("/api/transactions")
public class TransactionController {
    private final TransactionService service;

    @GetMapping
    public PageResponse<TransactionResponse> getAll(
            @Valid @ModelAttribute TransactionSearchCriteria criteria,
            @PageableDefault(size = 20, sort = "date", direction = Sort.Direction.DESC) Pageable pageable) {
        return service.getAll(criteria, pageable);
    }

    @GetMapping("/{id}")
    public TransactionResponse get(@PathVariable UUID id) { return service.get(id); }

    @PostMapping
    public ResponseEntity<TransactionResponse> create(@Valid @RequestBody TransactionRequest request) {
        TransactionResponse response = service.create(request);
        return ResponseEntity.created(URI.create("/api/transactions/" + response.id())).body(response);
    }

    @PutMapping("/{id}")
    public TransactionResponse update(@PathVariable UUID id, @Valid @RequestBody TransactionRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
