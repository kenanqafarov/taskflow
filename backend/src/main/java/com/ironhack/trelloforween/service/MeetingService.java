package com.ironhack.trelloforween.service;

import com.ironhack.trelloforween.entity.Meeting;
import com.ironhack.trelloforween.entity.User;
import com.ironhack.trelloforween.entity.Role;
import com.ironhack.trelloforween.repository.MeetingRepository;
import com.ironhack.trelloforween.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class MeetingService {
    private final MeetingRepository meetingRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final SimpMessagingTemplate messagingTemplate;

    public List<Meeting> getMeetings(User user) {
        if (user.getRole() == Role.SUPER_ADMIN) {
            return meetingRepository.findAll();
        }
        
        List<Meeting> allMeetings = meetingRepository.findAll();
        List<Meeting> userMeetings = new ArrayList<>();
        
        for (Meeting m : allMeetings) {
            boolean isCreator = m.getCreatedBy() != null && m.getCreatedBy().getId().equals(user.getId());
            boolean isInvited = false;
            if (m.getInviteeIds() != null && !m.getInviteeIds().isBlank()) {
                List<String> ids = Arrays.asList(m.getInviteeIds().split(","));
                isInvited = ids.contains(String.valueOf(user.getId()));
            }
            if (isCreator || isInvited) {
                userMeetings.add(m);
            }
        }
        return userMeetings;
    }

    public Optional<Meeting> getMeetingById(Long id) {
        return meetingRepository.findById(id);
    }

    @Transactional
    public Meeting createMeeting(Meeting meeting, User creator) {
        meeting.setCreatedBy(creator);
        Meeting saved = meetingRepository.save(meeting);

        // Notify invitees
        notifyInvitees(saved, creator);
        
        // Broadcast that meeting has started/created
        messagingTemplate.convertAndSend("/topic/meetings", saved);
        
        return saved;
    }

    @Transactional
    public Meeting updateMeeting(Long id, Meeting details) {
        Meeting meeting = meetingRepository.findById(id).orElseThrow();
        meeting.setTitle(details.getTitle());
        meeting.setInviteeIds(details.getInviteeIds());
        meeting.setBoard(details.getBoard());
        meeting.setStartedAt(details.getStartedAt());
        return meetingRepository.save(meeting);
    }

    @Transactional
    public void deleteMeeting(Long id) {
        meetingRepository.deleteById(id);
    }

    private void notifyInvitees(Meeting meeting, User creator) {
        if (meeting.getInviteeIds() == null || meeting.getInviteeIds().isBlank()) {
            return;
        }
        String[] ids = meeting.getInviteeIds().split(",");
        for (String idStr : ids) {
            try {
                Long userId = Long.parseLong(idStr.trim());
                userRepository.findById(userId).ifPresent(recipient -> {
                    notificationService.sendSystemNotification(
                        recipient,
                        "New Meeting Started",
                        creator.getName() + " started a meeting: " + meeting.getTitle(),
                        "MEETING_STARTED"
                    );
                });
            } catch (NumberFormatException ignored) {}
        }
    }
}
