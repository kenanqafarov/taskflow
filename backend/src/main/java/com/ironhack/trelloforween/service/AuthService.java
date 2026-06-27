package com.ironhack.trelloforween.service;

import com.ironhack.trelloforween.dto.AuthRequest;
import com.ironhack.trelloforween.dto.AuthResponse;
import com.ironhack.trelloforween.dto.RegisterRequest;
import com.ironhack.trelloforween.entity.Role;
import com.ironhack.trelloforween.entity.User;
import com.ironhack.trelloforween.exception.EmailAlreadyExistsException;
import com.ironhack.trelloforween.exception.InvalidTokenException;
import com.ironhack.trelloforween.exception.UserNotFoundException;
import com.ironhack.trelloforween.repository.UserRepository;
import com.ironhack.trelloforween.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new EmailAlreadyExistsException("Email already exists");
        }
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new EmailAlreadyExistsException("Username already exists");
        }
        Role role = request.getRole() == null ? Role.MEMBER : Role.valueOf(request.getRole());
        var user = User.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .name(request.getName())
                .username(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(role)
                .positionTitle(request.getPositionTitle())
                .phone(request.getPhone())
                .githubUrl(request.getGithubUrl())
                .linkedinUrl(request.getLinkedinUrl())
                .profilePicture(request.getProfilePicture())
                .active(true)
                .build();
        userRepository.save(user);
        var jwtToken = jwtService.generateToken(user);
        var refreshToken = jwtService.generateRefreshToken(user);
        return AuthResponse.builder()
                .token(jwtToken)
                .refreshToken(refreshToken)
                .username(user.getUsername())
                .role(user.getRole().name())
                .build();
    }

    public AuthResponse login(AuthRequest request) {
        String username = request.getUsername() != null && !request.getUsername().isBlank()
                ? request.getUsername()
                : request.getEmail();
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        username,
                        request.getPassword()
                )
        );
        var user = userRepository.findByUsername(username)
                .or(() -> userRepository.findByEmail(username))
                .orElseThrow(() -> new UserNotFoundException("User not found"));
        var jwtToken = jwtService.generateToken(user);
        var refreshToken = jwtService.generateRefreshToken(user);
        
        return AuthResponse.builder()
                .token(jwtToken)
                .refreshToken(refreshToken)
                .username(user.getUsername())
                .role(user.getRole().name())
                .build();
    }

    public AuthResponse refreshToken(String requestRefreshToken) {
        String userEmail = jwtService.extractUsername(requestRefreshToken);
        if (userEmail != null) {
            var user = this.userRepository.findByUsername(userEmail)
                    .or(() -> userRepository.findByEmail(userEmail))
                    .orElseThrow(() -> new UserNotFoundException("User not found for this token"));
            if (jwtService.isTokenValid(requestRefreshToken, user)) {
                var accessToken = jwtService.generateToken(user);
                return AuthResponse.builder()
                        .token(accessToken)
                        .refreshToken(requestRefreshToken)
                        .username(user.getUsername())
                        .role(user.getRole().name())
                        .build();
            }
        }
        throw new InvalidTokenException("Refresh token is invalid or expired");
    }
}
