package com.grouptest.repository;

import com.grouptest.entity.AiBotTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AiBotTemplateRepository extends JpaRepository<AiBotTemplate, Long> {
    List<AiBotTemplate> findByIndustry(String industry);
    List<AiBotTemplate> findByIndustryAndIsSelectedTrue(String industry);
}

