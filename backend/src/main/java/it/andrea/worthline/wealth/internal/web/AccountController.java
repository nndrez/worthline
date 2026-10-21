package it.andrea.worthline.wealth.internal.web;

import it.andrea.worthline.wealth.internal.dto.*;
import it.andrea.worthline.wealth.internal.service.AccountService;
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
@RequestMapping("/api/accounts")
public class AccountController {
    private final AccountService service;

    @GetMapping
    public PageResponse<AccountResponse> getAll(
            @Valid @ModelAttribute AccountSearchCriteria criteria,
            @PageableDefault(size = 20, sort = "name", direction = Sort.Direction.ASC) Pageable pageable) {
        return service.getAll(criteria, pageable);
    }

    @GetMapping("/{id}")
    public AccountResponse get(@PathVariable UUID id) { return service.get(id); }

    @PostMapping
    public ResponseEntity<AccountResponse> create(@Valid @RequestBody AccountRequest request) {
        AccountResponse response = service.create(request);
        return ResponseEntity.created(URI.create("/api/accounts/" + response.id())).body(response);
    }

    @PutMapping("/{id}")
    public AccountResponse update(@PathVariable UUID id, @Valid @RequestBody AccountRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
