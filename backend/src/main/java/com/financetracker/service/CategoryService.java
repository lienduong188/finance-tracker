package com.financetracker.service;

import com.financetracker.dto.category.CategoryRequest;
import com.financetracker.dto.category.CategoryResponse;
import com.financetracker.entity.Category;
import com.financetracker.entity.CategoryType;
import com.financetracker.entity.User;
import com.financetracker.exception.ApiException;
import com.financetracker.repository.CategoryRepository;
import com.financetracker.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;

    public List<CategoryResponse> getAllCategories(UUID userId) {
        return deduplicateCategories(categoryRepository.findByUserIdOrSystemCategories(userId))
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<CategoryResponse> getCategoriesByType(UUID userId, CategoryType type) {
        return deduplicateCategories(categoryRepository.findByUserIdOrSystemAndType(userId, type))
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Remove duplicate categories, keeping system categories over user categories with same name
     */
    private List<Category> deduplicateCategories(List<Category> categories) {
        java.util.Map<String, Category> uniqueCategories = new java.util.LinkedHashMap<>();

        // First pass: add all system categories
        for (Category cat : categories) {
            if (cat.getIsSystem()) {
                uniqueCategories.put(cat.getName() + "_" + cat.getType(), cat);
            }
        }

        // Second pass: add user categories only if no system category with same name exists
        for (Category cat : categories) {
            if (!cat.getIsSystem()) {
                String key = cat.getName() + "_" + cat.getType();
                if (!uniqueCategories.containsKey(key)) {
                    uniqueCategories.put(key, cat);
                }
            }
        }

        return new java.util.ArrayList<>(uniqueCategories.values());
    }

    @Transactional
    public CategoryResponse createCategory(UUID userId, CategoryRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> ApiException.notFound("User"));

        Category parent = null;
        if (request.getParentId() != null) {
            parent = categoryRepository.findByIdAndUserIdOrSystem(request.getParentId(), userId)
                    .orElseThrow(() -> ApiException.notFound("Parent category"));
        }

        Category category = Category.builder()
                .user(user)
                .name(request.getName())
                .type(request.getType())
                .icon(request.getIcon())
                .color(request.getColor())
                .parent(parent)
                .isSystem(false)
                .build();

        category = categoryRepository.save(category);
        return toResponse(category);
    }

    @Transactional
    public CategoryResponse updateCategory(UUID userId, UUID categoryId, CategoryRequest request) {
        Category category = categoryRepository.findByIdAndUserId(categoryId, userId)
                .orElseThrow(() -> ApiException.notFound("Category"));

        if (category.getIsSystem()) {
            throw ApiException.badRequest("Cannot modify system category");
        }

        category.setName(request.getName());
        category.setIcon(request.getIcon());
        category.setColor(request.getColor());

        category = categoryRepository.save(category);
        return toResponse(category);
    }

    @Transactional
    public void deleteCategory(UUID userId, UUID categoryId) {
        Category category = categoryRepository.findByIdAndUserId(categoryId, userId)
                .orElseThrow(() -> ApiException.notFound("Category"));

        if (category.getIsSystem()) {
            throw ApiException.badRequest("Cannot delete system category");
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
