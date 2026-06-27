package com.ironhack.trelloforween.repository;

import com.ironhack.trelloforween.entity.ChatGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ChatGroupRepository extends JpaRepository<ChatGroup, Long> {
    List<ChatGroup> findByMemberIdsContaining(String userId);
}
