package com.ironhack.trelloforween.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class InviteRequest {
    private Long boardId;
    private String inviteeEmail;
}
