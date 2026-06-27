package com.ironhack.trelloforween.repository;

import com.ironhack.trelloforween.entity.Meeting;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface MeetingRepository extends JpaRepository<Meeting, Long> {
    Optional<Meeting> findByRoomSlug(String roomSlug);
    List<Meeting> findByCreatedByIdOrderByStartedAtDesc(Long userId);
}
