package com.ironhack.trelloforween.service;

import com.ironhack.trelloforween.entity.Board;
import com.ironhack.trelloforween.entity.Invitation;
import com.ironhack.trelloforween.entity.User;
import com.ironhack.trelloforween.repository.InvitationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.UUID;

import com.ironhack.trelloforween.exception.InvalidTokenException;
import com.ironhack.trelloforween.exception.UnauthorizedActionException;

@Service
@RequiredArgsConstructor
public class InvitationService {

    private final InvitationRepository invitationRepository;
    private final EmailService emailService;
    private final BoardService boardService;

    public void sendInvitation(Long boardId, String inviteeEmail, User inviter) {
        Board board = boardService.getBoardById(boardId);

        if (!board.getOwner().getId().equals(inviter.getId())) {
            throw new UnauthorizedActionException("Only board owner can invite");
        }

        String token = UUID.randomUUID().toString();

        Invitation invitation = Invitation.builder()
                .board(board)
                .inviter(inviter)
                .inviteeEmail(inviteeEmail)
                .token(token)
                .status("PENDING")
                .build();

        invitationRepository.save(invitation);

        String acceptLink = "http://localhost:8080/api/invitations/accept?token=" + token;
        
        String emailBody = String.format(
            "Salam!\n\n%s sizi '%s' layihə lövhəsinə qoşulmağa dəvət edir.\n\nDəvəti qəbul etmək üçün aşağıdakı linkə daxil olun:\n%s\n\nTəşəkkürlər,\nTrelloForWeen Komandası",
            inviter.getName(), board.getName(), acceptLink
        );

        emailService.sendEmail(inviteeEmail, "TrelloForWeen - Yeni Layihə Dəvəti", emailBody);
    }

    public String acceptInvitation(String token) {
        Invitation invitation = invitationRepository.findByToken(token)
                .orElseThrow(() -> new InvalidTokenException("Invalid invitation token"));

        if (!"PENDING".equals(invitation.getStatus())) {
            throw new InvalidTokenException("Dəvət artıq qəbul edilib və ya rədd edilib.");
        }

        invitation.setStatus("ACCEPTED");
        invitationRepository.save(invitation);

        // Here we could add logic to add user to a BoardMembers table
        // But for simplicity, we just mark it as ACCEPTED.

        return "Dəvət uğurla qəbul edildi! İndi lövhəyə daxil ola bilərsiniz.";
    }
}
