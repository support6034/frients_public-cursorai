package com.grouptest.repository;

import com.grouptest.entity.AiBotSetting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AiBotSettingRepository extends JpaRepository<AiBotSetting, Long> {
    Optional<AiBotSetting> findByIndustry(String industry);
}

