package it.andrea.worthline.transactions.internal.web;

import it.andrea.worthline.transactions.internal.dto.*;
import it.andrea.worthline.transactions.internal.service.CategoryService;
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
@RequestMapping("/api/categories")
public class CategoryController {
    private final CategoryService service;

    @GetMapping
    public PageResponse<CategoryResponse> getAll(
            @Valid @ModelAttribute CategorySearchCriteria criteria,
            @PageableDefault(size = 20, sort = "name", direction = Sort.Direction.ASC) Pageable pageable) {
        return service.getAll(criteria, pageable);
    }

    @GetMapping("/{id}")
    public CategoryResponse get(@PathVariable UUID id) { return service.get(id); }

    @PostMapping
    public ResponseEntity<CategoryResponse> create(@Valid @RequestBody CategoryRequest request) {
        CategoryResponse response = service.create(request);
        return ResponseEntity.created(URI.create("/api/categories/" + response.id())).body(response);
    }

    @PutMapping("/{id}")
    public CategoryResponse update(@PathVariable UUID id, @Valid @RequestBody CategoryRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
