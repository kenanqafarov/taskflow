package com.ironhack.trelloforween.controller;

import com.ironhack.trelloforween.dto.AuthRequest;
import com.ironhack.trelloforween.dto.AuthResponse;
import com.ironhack.trelloforween.dto.RegisterRequest;
import com.ironhack.trelloforween.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody AuthRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/refreshtoken")
    public ResponseEntity<AuthResponse> refreshtoken(@org.springframework.web.bind.annotation.RequestParam String refreshToken) {
        return ResponseEntity.ok(authService.refreshToken(refreshToken));
    }

    @GetMapping("/me")
    public ResponseEntity<com.ironhack.trelloforween.entity.User> getMe(@org.springframework.security.core.annotation.AuthenticationPrincipal com.ironhack.trelloforween.entity.User user) {
        if (user == null) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(user);
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout() {
        return ResponseEntity.ok().build();
    }
}
