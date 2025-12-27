package com.grouptest.repository;

import com.grouptest.entity.ListMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ListMemberRepository extends JpaRepository<ListMember, Long> {
    List<ListMember> findByListId(Long listId);
    Optional<ListMember> findByListIdAndLeadEmail(Long listId, String leadEmail);
    List<ListMember> findByLeadEmail(String leadEmail);
}

