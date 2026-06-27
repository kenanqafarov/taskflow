package com.ironhack.trelloforween.service;

import com.ironhack.trelloforween.entity.*;
import com.ironhack.trelloforween.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;
    private final BoardColumnRepository boardColumnRepository;
    private final TaskCommentRepository taskCommentRepository;
    private final AttachmentRepository attachmentRepository;
    private final ActivityLogRepository activityLogRepository;
    private final NotificationService notificationService;
    private final SimpMessagingTemplate messagingTemplate;

    public List<Task> getAllTasks() {
        return taskRepository.findAll();
    }

    public List<Task> getTasksForUser(User user) {
        if (user.getRole() == Role.SUPER_ADMIN) {
            return taskRepository.findAll();
        }
        // Return tasks assigned to the user or belonging to user's boards
        return taskRepository.findByAssignedUserId(user.getId());
    }

    public Optional<Task> getTaskById(Long id) {
        return taskRepository.findById(id);
    }

    public List<Task> getTasksByStatus(TaskStatus status) {
        return taskRepository.findByStatus(status);
    }

    @Transactional
    public Task createTask(Task task, User creator) {
        if (task.getColumn() == null && task.getBoard() != null) {
            List<BoardColumn> columns = boardColumnRepository.findByBoardIdOrderByPositionAsc(task.getBoard().getId());
            if (!columns.isEmpty()) {
                task.setColumn(columns.get(0));
            }
        }
        
        Task savedTask = taskRepository.save(task);
        logActivity("CREATED_TASK", "Task", savedTask.getId(), creator);
        
        // Notify assignee if assigned
        if (savedTask.getAssignedUser() != null) {
            notificationService.sendSystemNotification(
                savedTask.getAssignedUser(),
                "Task Assigned",
                "You have been assigned to task: " + savedTask.getTitle(),
                "TASK_ASSIGNED"
            );
        }

        broadcastTaskUpdate(savedTask);
        return savedTask;
    }

    @Transactional
    public Task updateTask(Long id, Task taskDetails, User actor) {
        return taskRepository.findById(id).map(task -> {
            boolean statusChanged = task.getStatus() != taskDetails.getStatus();
            boolean assigneeChanged = (task.getAssignedUser() == null && taskDetails.getAssignedUser() != null) ||
                    (task.getAssignedUser() != null && taskDetails.getAssignedUser() == null) ||
                    (task.getAssignedUser() != null && taskDetails.getAssignedUser() != null && !task.getAssignedUser().getId().equals(taskDetails.getAssignedUser().getId()));
            
            task.setTitle(taskDetails.getTitle());
            task.setDescription(taskDetails.getDescription());
            task.setStatus(taskDetails.getStatus());
            task.setPriority(taskDetails.getPriority());
            task.setLabels(taskDetails.getLabels());
            task.setChecklist(taskDetails.getChecklist());
            task.setAttachmentUrl(taskDetails.getAttachmentUrl());
            task.setAssignedUser(taskDetails.getAssignedUser());
            task.setBoard(taskDetails.getBoard());
            task.setColumn(taskDetails.getColumn());
            task.setDueDate(taskDetails.getDueDate());

            Task updatedTask = taskRepository.save(task);
            logActivity("UPDATED_TASK", "Task", updatedTask.getId(), actor);

            if (assigneeChanged && updatedTask.getAssignedUser() != null) {
                notificationService.sendSystemNotification(
                    updatedTask.getAssignedUser(),
                    "Task Assigned",
                    "You have been assigned to task: " + updatedTask.getTitle(),
                    "TASK_ASSIGNED"
                );
            }

            if (statusChanged && updatedTask.getAssignedUser() != null) {
                notificationService.sendSystemNotification(
                    updatedTask.getAssignedUser(),
                    "Task Status Changed",
                    "Task \"" + updatedTask.getTitle() + "\" is now " + updatedTask.getStatus(),
                    "TASK_STATUS"
                );
            }

            broadcastTaskUpdate(updatedTask);
            return updatedTask;
        }).orElseThrow(() -> new RuntimeException("Task not found with id " + id));
    }

    @Transactional
    public void deleteTask(Long id, User actor) {
        taskRepository.findById(id).ifPresent(task -> {
            logActivity("DELETED_TASK", "Task", id, actor);
            taskRepository.delete(task);
            broadcastTaskUpdate(task);
        });
    }

    @Transactional
    public Task moveTask(Long taskId, Long columnId, TaskStatus status, User actor) {
        Task task = taskRepository.findById(taskId).orElseThrow();
        BoardColumn col = boardColumnRepository.findById(columnId).orElseThrow();
        task.setColumn(col);
        task.setStatus(status);
        Task updated = taskRepository.save(task);

        logActivity("MOVED_TASK", "Task", taskId, actor);
        
        if (updated.getAssignedUser() != null) {
            notificationService.sendSystemNotification(
                updated.getAssignedUser(),
                "Task Moved",
                "Task \"" + updated.getTitle() + "\" moved to " + col.getName(),
                "TASK_STATUS"
            );
        }

        broadcastTaskUpdate(updated);
        return updated;
    }

    @Transactional
    public Task assignTask(Long taskId, User assignee, User actor) {
        Task task = taskRepository.findById(taskId).orElseThrow();
        task.setAssignedUser(assignee);
        Task updated = taskRepository.save(task);

        logActivity("ASSIGNED_TASK", "Task", taskId, actor);

        if (assignee != null) {
            notificationService.sendSystemNotification(
                assignee,
                "Task Assigned",
                "You have been assigned to task: " + updated.getTitle(),
                "TASK_ASSIGNED"
            );
        }

        broadcastTaskUpdate(updated);
        return updated;
    }

    // Comments operations
    public List<TaskComment> getComments(Long taskId) {
        return taskCommentRepository.findByTaskIdOrderByCreatedAtAsc(taskId);
    }

    @Transactional
    public TaskComment addComment(Long taskId, TaskComment comment, User author) {
        Task task = taskRepository.findById(taskId).orElseThrow();
        comment.setTask(task);
        comment.setAuthor(author);
        TaskComment saved = taskCommentRepository.save(comment);

        logActivity("ADDED_COMMENT", "Task", taskId, author);

        if (task.getAssignedUser() != null && !task.getAssignedUser().getId().equals(author.getId())) {
            notificationService.sendSystemNotification(
                task.getAssignedUser(),
                "New Comment",
                author.getName() + " commented on task: " + task.getTitle(),
                "TASK_COMMENT"
            );
        }

        broadcastTaskUpdate(task);
        return saved;
    }

    @Transactional
    public void deleteComment(Long commentId) {
        taskCommentRepository.deleteById(commentId);
    }

    // Attachments operations
    public List<Attachment> getAttachments(Long taskId) {
        return attachmentRepository.findByTaskIdOrderByUploadedAtAsc(taskId);
    }

    @Transactional
    public Attachment addAttachment(Long taskId, Attachment attachment, User actor) {
        Task task = taskRepository.findById(taskId).orElseThrow();
        attachment.setTask(task);
        Attachment saved = attachmentRepository.save(attachment);

        logActivity("ADDED_ATTACHMENT", "Task", taskId, actor);
        broadcastTaskUpdate(task);
        return saved;
    }

    @Transactional
    public void deleteAttachment(Long attachmentId) {
        attachmentRepository.deleteById(attachmentId);
    }

    private void logActivity(String action, String entityType, Long entityId, User actor) {
        activityLogRepository.save(ActivityLog.builder()
                .action(action)
                .entityType(entityType)
                .entityId(entityId)
                .actor(actor)
                .build());
    }

    private void broadcastTaskUpdate(Task task) {
        if (task.getBoard() != null) {
            messagingTemplate.convertAndSend("/topic/boards/" + task.getBoard().getId() + "/tasks", "UPDATED");
        }
    }
}
