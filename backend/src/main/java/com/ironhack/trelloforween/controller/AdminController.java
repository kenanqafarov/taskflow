package com.ironhack.trelloforween.controller;

import com.ironhack.trelloforween.repository.BoardRepository;
import com.ironhack.trelloforween.repository.ChatGroupRepository;
import com.ironhack.trelloforween.repository.TaskRepository;
import com.ironhack.trelloforween.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {
    private final UserRepository userRepository;
    private final BoardRepository boardRepository;
    private final TaskRepository taskRepository;
    private final ChatGroupRepository chatGroupRepository;

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Long>> stats() {
        return ResponseEntity.ok(Map.of(
                "users", userRepository.count(),
                "boards", boardRepository.count(),
                "tasks", taskRepository.count(),
                "chatGroups", chatGroupRepository.count()
        ));
    }
}
