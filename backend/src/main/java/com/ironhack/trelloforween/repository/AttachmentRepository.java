package com.ironhack.trelloforween.repository;

import com.ironhack.trelloforween.entity.Attachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AttachmentRepository extends JpaRepository<Attachment, Long> {
    List<Attachment> findByTaskIdOrderByUploadedAtAsc(Long taskId);
}
