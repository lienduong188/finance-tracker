package com.financetracker.service;

import com.financetracker.dto.admin.AdminCategoryRequest;
import com.financetracker.dto.category.CategoryResponse;
import com.financetracker.entity.Category;
import com.financetracker.exception.ApiException;
import com.financetracker.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminCategoryService {

    private final CategoryRepository categoryRepository;

    public List<CategoryResponse> getSystemCategories() {
        return categoryRepository.findByIsSystemTrue()
                .stream()
                .filter(c -> c.getParent() == null) // Only top-level categories
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public CategoryResponse createSystemCategory(AdminCategoryRequest request) {
        Category parent = null;
        if (request.getParentId() != null) {
            parent = categoryRepository.findById(request.getParentId())
                    .filter(Category::getIsSystem)
                    .orElseThrow(() -> ApiException.notFound("Parent category"));
        }

        Category category = Category.builder()
                .user(null) // System categories have no user
                .name(request.getName())
                .type(request.getType())
                .icon(request.getIcon())
                .color(request.getColor())
                .parent(parent)
                .isSystem(true)
                .build();

        category = categoryRepository.save(category);
        return toResponse(category);
    }

    @Transactional
    public CategoryResponse updateSystemCategory(UUID id, AdminCategoryRequest request) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Category"));

        if (!category.getIsSystem()) {
            throw ApiException.badRequest("Can only update system categories");
        }

        category.setName(request.getName());
        category.setType(request.getType());
        category.setIcon(request.getIcon());
        category.setColor(request.getColor());

        category = categoryRepository.save(category);
        return toResponse(category);
    }

    @Transactional
    public void deleteSystemCategory(UUID id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Category"));

        if (!category.getIsSystem()) {
            throw ApiException.badRequest("Can only delete system categories");
        }

        categoryRepository.delete(category);
    }

    private CategoryResponse toResponse(Category category) {
        return CategoryResponse.builder()
                .id(category.getId())
                .name(category.getName())
                .type(category.getType())
                .icon(category.getIcon())
                .color(category.getColor())
                .parentId(category.getParent() != null ? category.getParent().getId() : null)
                .isSystem(category.getIsSystem())
                .children(category.getChildren().stream()
                        .map(this::toResponse)
                        .collect(Collectors.toList()))
                .build();
    }
}
