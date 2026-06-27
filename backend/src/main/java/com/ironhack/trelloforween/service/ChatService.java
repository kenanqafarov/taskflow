package com.ironhack.trelloforween.service;

import com.ironhack.trelloforween.entity.ChatGroup;
import com.ironhack.trelloforween.entity.Message;
import com.ironhack.trelloforween.entity.User;
import com.ironhack.trelloforween.entity.Role;
import com.ironhack.trelloforween.entity.Board;
import com.ironhack.trelloforween.repository.ChatGroupRepository;
import com.ironhack.trelloforween.repository.MessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ChatService {
    private final ChatGroupRepository chatGroupRepository;
    private final MessageRepository messageRepository;
    private final BoardService boardService;
    private final SimpMessagingTemplate messagingTemplate;

    public List<ChatGroup> getGroupsFor(User user) {
        if (user.getRole() == Role.SUPER_ADMIN) {
            return chatGroupRepository.findAll();
        }
        
        List<ChatGroup> allGroups = chatGroupRepository.findAll();
        List<ChatGroup> userGroups = new ArrayList<>();
        
        List<Long> userBoardIds = boardService.getMyBoards(user).stream().map(Board::getId).toList();

        for (ChatGroup group : allGroups) {
            boolean isCreator = group.getCreatedBy() != null && group.getCreatedBy().getId().equals(user.getId());
            boolean isMember = false;
            if (group.getMemberIds() != null && !group.getMemberIds().isBlank()) {
                List<String> ids = Arrays.asList(group.getMemberIds().split(","));
                isMember = ids.contains(String.valueOf(user.getId()));
            }
            boolean isBoardGroup = group.getBoard() != null && userBoardIds.contains(group.getBoard().getId());

            if (isCreator || isMember || isBoardGroup) {
                userGroups.add(group);
            }
        }
        return userGroups;
    }

    @Transactional
    public ChatGroup createGroup(ChatGroup group, User creator) {
        group.setCreatedBy(creator);
        return chatGroupRepository.save(group);
    }

    public List<Message> getMessages(Long groupId) {
        return messageRepository.findByChatGroupIdOrderByCreatedAtAsc(groupId);
    }

    @Transactional
    public Message sendMessage(Long groupId, Message message, User sender) {
        ChatGroup group = chatGroupRepository.findById(groupId).orElseThrow();
        message.setChatGroup(group);
        message.setSender(sender);
        Message saved = messageRepository.save(message);

        // Broadcast to WebSocket clients subscribing to this group chat topic
        messagingTemplate.convertAndSend("/topic/chat/" + groupId, saved);
        
        // Also broadcast a typing indicator clear / new message event to user notifications
        return saved;
    }
}
