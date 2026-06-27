package com.ironhack.trelloforween.controller;

import com.ironhack.trelloforween.dto.InviteRequest;
import com.ironhack.trelloforween.entity.User;
import com.ironhack.trelloforween.service.InvitationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/invitations")
@RequiredArgsConstructor
public class InvitationController {

    private final InvitationService invitationService;

    @PostMapping("/send")
    public ResponseEntity<String> sendInvitation(@RequestBody InviteRequest request, @AuthenticationPrincipal User inviter) {
        invitationService.sendInvitation(request.getBoardId(), request.getInviteeEmail(), inviter);
        return ResponseEntity.ok("Dəvət e-poçtla göndərildi!");
    }

    @GetMapping("/accept")
    public ResponseEntity<String> acceptInvitation(@RequestParam String token) {
        String result = invitationService.acceptInvitation(token);
        return ResponseEntity.ok(result);
    }
}
