package com.financetracker.dto.category;

import com.financetracker.entity.CategoryType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CategoryResponse {

    private UUID id;
    private String name;
    private CategoryType type;
    private String icon;
    private String color;
    private UUID parentId;
    private Boolean isSystem;
    private List<CategoryResponse> children;
}
