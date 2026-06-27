package com.ironhack.trelloforween.controller;

import com.ironhack.trelloforween.entity.Meeting;
import com.ironhack.trelloforween.entity.User;
import com.ironhack.trelloforween.service.MeetingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/meetings")
@RequiredArgsConstructor
public class MeetingController {
    private final MeetingService meetingService;

    @GetMapping
    public ResponseEntity<List<Meeting>> all(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(meetingService.getMeetings(user));
    }

    @PostMapping
    public ResponseEntity<Meeting> create(@RequestBody Meeting meeting, @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(meetingService.createMeeting(meeting, user));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Meeting> getById(@PathVariable Long id) {
        return meetingService.getMeetingById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<Meeting> update(@PathVariable Long id, @RequestBody Meeting details) {
        try {
            return ResponseEntity.ok(meetingService.updateMeeting(id, details));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        meetingService.deleteMeeting(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/join")
    public ResponseEntity<Meeting> join(@PathVariable Long id, @AuthenticationPrincipal User user) {
        return meetingService.getMeetingById(id)
                .map(meeting -> ResponseEntity.ok(meeting)) // Ready for future WebRTC / room join logic
                .orElse(ResponseEntity.notFound().build());
    }
}
