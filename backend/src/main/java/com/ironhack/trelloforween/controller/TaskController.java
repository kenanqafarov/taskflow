package com.ironhack.trelloforween.controller;

import com.ironhack.trelloforween.entity.*;
import com.ironhack.trelloforween.service.TaskService;
import com.ironhack.trelloforween.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;
    private final UserService userService;

    @GetMapping
    public ResponseEntity<List<Task>> getAllTasks(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(taskService.getTasksForUser(user));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Task> getTaskById(@PathVariable Long id) {
        return taskService.getTaskById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<Task>> getTasksByStatus(@PathVariable TaskStatus status) {
        return ResponseEntity.ok(taskService.getTasksByStatus(status));
    }

    @PostMapping
    public ResponseEntity<Task> createTask(@RequestBody Task task, @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(taskService.createTask(task, user));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Task> updateTask(@PathVariable Long id, @RequestBody Task task, @AuthenticationPrincipal User user) {
        try {
            return ResponseEntity.ok(taskService.updateTask(id, task, user));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTask(@PathVariable Long id, @AuthenticationPrincipal User user) {
        taskService.deleteTask(id, user);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/move")
    public ResponseEntity<Task> moveTask(
            @PathVariable Long id,
            @RequestParam Long columnId,
            @RequestParam TaskStatus status,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(taskService.moveTask(id, columnId, status, user));
    }

    @PatchMapping("/{id}/assign")
    public ResponseEntity<Task> assignTask(
            @PathVariable Long id,
            @RequestParam(required = false) Long userId,
            @AuthenticationPrincipal User user) {
        User assignee = null;
        if (userId != null) {
            assignee = userService.getUserById(userId).orElseThrow();
        }
        return ResponseEntity.ok(taskService.assignTask(id, assignee, user));
    }

    // Task Comments APIs
    @GetMapping("/{id}/comments")
    public ResponseEntity<List<TaskComment>> getComments(@PathVariable Long id) {
        return ResponseEntity.ok(taskService.getComments(id));
    }

    @PostMapping("/{id}/comments")
    public ResponseEntity<TaskComment> addComment(
            @PathVariable Long id,
            @RequestBody TaskComment comment,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(taskService.addComment(id, comment, user));
    }

    @DeleteMapping("/{id}/comments/{commentId}")
    public ResponseEntity<Void> deleteComment(@PathVariable Long id, @PathVariable Long commentId) {
        taskService.deleteComment(commentId);
        return ResponseEntity.noContent().build();
    }

    // Task Attachments APIs
    @GetMapping("/{id}/attachments")
    public ResponseEntity<List<Attachment>> getAttachments(@PathVariable Long id) {
        return ResponseEntity.ok(taskService.getAttachments(id));
    }

    @PostMapping("/{id}/attachments")
    public ResponseEntity<Attachment> addAttachment(
            @PathVariable Long id,
            @RequestBody Attachment attachment,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(taskService.addAttachment(id, attachment, user));
    }

    @DeleteMapping("/{id}/attachments/{attachmentId}")
    public ResponseEntity<Void> deleteAttachment(@PathVariable Long id, @PathVariable Long attachmentId) {
        taskService.deleteAttachment(attachmentId);
        return ResponseEntity.noContent().build();
    }
}
