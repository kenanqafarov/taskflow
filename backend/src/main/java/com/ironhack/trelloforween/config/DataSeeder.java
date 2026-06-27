package com.ironhack.trelloforween.config;

import com.ironhack.trelloforween.entity.Role;
import com.ironhack.trelloforween.entity.User;
import com.ironhack.trelloforween.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
@RequiredArgsConstructor
public class DataSeeder {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Bean
    CommandLineRunner seedSuperAdmin() {
        return args -> {
            if (!userRepository.existsByUsername("super_admin")) {
                userRepository.save(User.builder()
                        .firstName("Super")
                        .lastName("Admin")
                        .name("Super Admin")
                        .username("super_admin")
                        .email("super_admin@taskflow.local")
                        .password(passwordEncoder.encode("super1234!"))
                        .role(Role.SUPER_ADMIN)
                        .positionTitle("Platform Owner")
                        .active(true)
                        .build());
            }

            if (!userRepository.existsByUsername("admin")) {
                userRepository.save(User.builder()
                        .firstName("Jane")
                        .lastName("Doe")
                        .name("Jane Admin")
                        .username("admin")
                        .email("admin@taskflow.local")
                        .password(passwordEncoder.encode("admin1234!"))
                        .role(Role.ADMIN)
                        .positionTitle("Project Lead")
                        .active(true)
                        .build());
            }

            if (!userRepository.existsByUsername("member")) {
                userRepository.save(User.builder()
                        .firstName("John")
                        .lastName("Smith")
                        .name("John Member")
                        .username("member")
                        .email("member@taskflow.local")
                        .password(passwordEncoder.encode("member1234!"))
                        .role(Role.MEMBER)
                        .positionTitle("Software Engineer")
                        .active(true)
                        .build());
            }
        };
    }
}
