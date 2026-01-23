package com.financetracker.controller;

import com.financetracker.dto.admin.AdminCategoryRequest;
import com.financetracker.dto.category.CategoryResponse;
import com.financetracker.service.AdminCategoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/categories")
@RequiredArgsConstructor
@Tag(name = "Admin - Categories", description = "Admin system category management endpoints")
@PreAuthorize("hasRole('ADMIN')")
public class AdminCategoryController {

    private final AdminCategoryService adminCategoryService;

    @GetMapping
    @Operation(summary = "Get all system categories")
    public ResponseEntity<List<CategoryResponse>> getSystemCategories() {
        return ResponseEntity.ok(adminCategoryService.getSystemCategories());
    }

    @PostMapping
    @Operation(summary = "Create a system category")
    public ResponseEntity<CategoryResponse> createSystemCategory(
            @Valid @RequestBody AdminCategoryRequest request) {
        return ResponseEntity.ok(adminCategoryService.createSystemCategory(request));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a system category")
    public ResponseEntity<CategoryResponse> updateSystemCategory(
            @PathVariable UUID id,
            @Valid @RequestBody AdminCategoryRequest request) {
        return ResponseEntity.ok(adminCategoryService.updateSystemCategory(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a system category")
    public ResponseEntity<Void> deleteSystemCategory(@PathVariable UUID id) {
        adminCategoryService.deleteSystemCategory(id);
        return ResponseEntity.noContent().build();
    }
}
