package it.andrea.worthline.core;

import java.util.List;
import org.springframework.data.domain.Page;

public record PageResponse<T>(List<T> content, PageMetadata page) {
    public static <T> PageResponse<T> fromPage(Page<T> page) {
        return new PageResponse<>(page.getContent(), new PageMetadata(
                page.getNumber() + 1, page.getSize(), page.getTotalElements(), page.getTotalPages(),
                page.isFirst(), page.isLast()));
    }

    public record PageMetadata(int currentPage, int size, long totalElements, int totalPages,
                               boolean first, boolean last) {}
}
