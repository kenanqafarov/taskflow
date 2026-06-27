package com.ironhack.trelloforween.service;

import com.ironhack.trelloforween.entity.Notification;
import com.ironhack.trelloforween.entity.User;
import com.ironhack.trelloforween.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {
    private final NotificationRepository notificationRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public List<Notification> getFor(User user) {
        if (user.getRole().name().equals("SUPER_ADMIN")) {
            return notificationRepository.findAll();
        }
        return notificationRepository.findByRecipientIdOrderByCreatedAtDesc(user.getId());
    }

    public Notification create(Notification notification) {
        Notification saved = notificationRepository.save(notification);
        if (saved.getRecipient() != null) {
            messagingTemplate.convertAndSend("/topic/notifications/" + saved.getRecipient().getId(), saved);
        }
        return saved;
    }

    public Notification markRead(Long id) {
        Notification notification = notificationRepository.findById(id).orElseThrow();
        notification.setReadByUser(true);
        return notificationRepository.save(notification);
    }

    @Transactional
    public void markAllRead(User user) {
        List<Notification> notifications = notificationRepository.findByRecipientIdOrderByCreatedAtDesc(user.getId());
        for (Notification n : notifications) {
            n.setReadByUser(true);
        }
        notificationRepository.saveAll(notifications);
    }
    
    public void sendSystemNotification(User recipient, String title, String body, String type) {
        Notification n = Notification.builder()
                .recipient(recipient)
                .title(title)
                .body(body)
                .type(type)
                .readByUser(false)
                .build();
        create(n);
    }
}
