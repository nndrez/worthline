package it.andrea.worthline.wealth.internal.web;

import it.andrea.worthline.wealth.internal.dto.*;
import it.andrea.worthline.wealth.internal.service.MonthlyBalanceService;
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
@RequestMapping("/api/monthly-balances")
public class MonthlyBalanceController {
    private final MonthlyBalanceService service;

    @GetMapping
    public PageResponse<MonthlyBalanceResponse> getAll(
            @Valid @ModelAttribute MonthlyBalanceSearchCriteria criteria,
            @PageableDefault(size = 20, sort = "date", direction = Sort.Direction.DESC) Pageable pageable) {
        return service.getAll(criteria, pageable);
    }

    @GetMapping("/{id}")
    public MonthlyBalanceResponse get(@PathVariable UUID id) { return service.get(id); }

    @PostMapping
    public ResponseEntity<MonthlyBalanceResponse> create(@Valid @RequestBody MonthlyBalanceRequest request) {
        MonthlyBalanceResponse response = service.create(request);
        return ResponseEntity.created(URI.create("/api/monthly-balances/" + response.id())).body(response);
    }

    @PutMapping("/{id}")
    public MonthlyBalanceResponse update(@PathVariable UUID id, @Valid @RequestBody MonthlyBalanceRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
