package com.financetracker.controller;

import com.financetracker.dto.category.CategoryRequest;
import com.financetracker.dto.category.CategoryResponse;
import com.financetracker.entity.CategoryType;
import com.financetracker.security.CustomUserDetails;
import com.financetracker.service.CategoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
@Tag(name = "Categories", description = "Category management endpoints")
public class CategoryController {

    private final CategoryService categoryService;

    @GetMapping
    @Operation(summary = "Get all categories")
    public ResponseEntity<List<CategoryResponse>> getAllCategories(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(categoryService.getAllCategories(userDetails.getId()));
    }

    @GetMapping("/type/{type}")
    @Operation(summary = "Get categories by type")
    public ResponseEntity<List<CategoryResponse>> getCategoriesByType(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable CategoryType type) {
        return ResponseEntity.ok(categoryService.getCategoriesByType(userDetails.getId(), type));
    }

    @PostMapping
    @Operation(summary = "Create a custom category")
    public ResponseEntity<CategoryResponse> createCategory(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody CategoryRequest request) {
        return ResponseEntity.ok(categoryService.createCategory(userDetails.getId(), request));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a category")
    public ResponseEntity<CategoryResponse> updateCategory(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID id,
            @Valid @RequestBody CategoryRequest request) {
        return ResponseEntity.ok(categoryService.updateCategory(userDetails.getId(), id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a category")
    public ResponseEntity<Void> deleteCategory(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID id) {
        categoryService.deleteCategory(userDetails.getId(), id);
        return ResponseEntity.noContent().build();
    }
}
