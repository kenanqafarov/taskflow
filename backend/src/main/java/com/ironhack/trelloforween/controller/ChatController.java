package com.ironhack.trelloforween.controller;

import com.ironhack.trelloforween.entity.ChatGroup;
import com.ironhack.trelloforween.entity.Message;
import com.ironhack.trelloforween.entity.User;
import com.ironhack.trelloforween.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/chat-groups")
@RequiredArgsConstructor
public class ChatController {
    private final ChatService chatService;

    @GetMapping
    public ResponseEntity<List<ChatGroup>> groups(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(chatService.getGroupsFor(user));
    }

    @PostMapping
    public ResponseEntity<ChatGroup> createGroup(@RequestBody ChatGroup group, @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(chatService.createGroup(group, user));
    }

    @GetMapping("/{groupId}/messages")
    public ResponseEntity<List<Message>> messages(@PathVariable Long groupId) {
        return ResponseEntity.ok(chatService.getMessages(groupId));
    }

    @PostMapping("/{groupId}/messages")
    public ResponseEntity<Message> send(@PathVariable Long groupId, @RequestBody Message message, @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(chatService.sendMessage(groupId, message, user));
    }

    @MessageMapping("/chat/{groupId}")
    @SendTo("/topic/chat/{groupId}")
    public Message broadcast(@DestinationVariable Long groupId, @Payload Message message) {
        return message;
    }
}
