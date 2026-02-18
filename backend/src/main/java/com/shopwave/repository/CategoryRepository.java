package com.shopwave.repository;

import com.shopwave.model.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {
    Optional<Category> findBySlug(String slug);
    List<Category> findByParentIsNullAndIsActiveTrue();
    List<Category> findByParentIdAndIsActiveTrue(Long parentId);
}
@Entity
public class Category {
    // existing fields...
    
    @Column(name = "active")  // maps to DB column, adjust if needed
    private Boolean active = true;  // or boolean, default as needed
    
    // getter and setter
    public Boolean getActive() {
        return active;
    }
    
    public void setActive(Boolean active) {
        this.active = active;
    }
}