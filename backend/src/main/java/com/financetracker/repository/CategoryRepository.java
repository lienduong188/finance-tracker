package com.financetracker.repository;

import com.financetracker.entity.Category;
import com.financetracker.entity.CategoryType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CategoryRepository extends JpaRepository<Category, UUID> {

    @Query("SELECT c FROM Category c WHERE (c.user.id = :userId OR c.isSystem = true) AND c.parent IS NULL")
    List<Category> findByUserIdOrSystemCategories(@Param("userId") UUID userId);

    @Query("SELECT c FROM Category c WHERE (c.user.id = :userId OR c.isSystem = true) AND c.type = :type")
    List<Category> findByUserIdOrSystemAndType(@Param("userId") UUID userId, @Param("type") CategoryType type);

    List<Category> findByIsSystemTrue();

    List<Category> findByUserId(UUID userId);

    Optional<Category> findByIdAndUserId(UUID id, UUID userId);

    @Query("SELECT c FROM Category c WHERE c.id = :id AND (c.user.id = :userId OR c.isSystem = true)")
    Optional<Category> findByIdAndUserIdOrSystem(@Param("id") UUID id, @Param("userId") UUID userId);

    void deleteByUserIdAndIsSystemFalse(UUID userId);
}
