package com.grouptest.repository;

import com.grouptest.entity.ListEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ListRepository extends JpaRepository<ListEntity, Long> {
    Optional<ListEntity> findByName(String name);
}

