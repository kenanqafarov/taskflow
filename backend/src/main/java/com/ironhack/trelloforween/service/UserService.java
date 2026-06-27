package com.ironhack.trelloforween.service;

import com.ironhack.trelloforween.entity.User;
import com.ironhack.trelloforween.entity.Role;
import com.ironhack.trelloforween.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public Optional<User> getUserById(Long id) {
        return userRepository.findById(id);
    }

    public User createUser(User user) {
        if (user.getPassword() != null && !user.getPassword().startsWith("$2")) {
            user.setPassword(passwordEncoder.encode(user.getPassword()));
        }
        if (user.getRole() == null) {
            user.setRole(Role.MEMBER);
        }
        user.setActive(true);
        return userRepository.save(user);
    }

    public User updateUser(Long id, User userDetails) {
        return userRepository.findById(id).map(user -> {
            user.setName(userDetails.getName());
            user.setFirstName(userDetails.getFirstName());
            user.setLastName(userDetails.getLastName());
            user.setUsername(userDetails.getUsername());
            user.setEmail(userDetails.getEmail());
            user.setPositionTitle(userDetails.getPositionTitle());
            user.setPhone(userDetails.getPhone());
            user.setGithubUrl(userDetails.getGithubUrl());
            user.setLinkedinUrl(userDetails.getLinkedinUrl());
            user.setProfilePicture(userDetails.getProfilePicture());
            user.setRole(userDetails.getRole());
            user.setActive(userDetails.isActive());
            return userRepository.save(user);
        }).orElseThrow(() -> new RuntimeException("User not found with id " + id));
    }

    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }
}
