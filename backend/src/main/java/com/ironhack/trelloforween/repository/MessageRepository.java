package com.ironhack.trelloforween.repository;

import com.ironhack.trelloforween.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Long> {
    List<Message> findByChatGroupIdOrderByCreatedAtAsc(Long chatGroupId);
}
