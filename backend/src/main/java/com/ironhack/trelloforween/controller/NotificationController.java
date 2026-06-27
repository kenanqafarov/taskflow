package com.ironhack.trelloforween.controller;

import com.ironhack.trelloforween.entity.Notification;
import com.ironhack.trelloforween.entity.User;
import com.ironhack.trelloforween.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {
    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<List<Notification>> all(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(notificationService.getFor(user));
    }

    @PostMapping
    public ResponseEntity<Notification> create(@RequestBody Notification notification) {
        return ResponseEntity.ok(notificationService.create(notification));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<Notification> read(@PathVariable Long id) {
        return ResponseEntity.ok(notificationService.markRead(id));
    }

    @PatchMapping("/read-all")
    public ResponseEntity<Void> readAll(@AuthenticationPrincipal User user) {
        notificationService.markAllRead(user);
        return ResponseEntity.ok().build();
    }
}
