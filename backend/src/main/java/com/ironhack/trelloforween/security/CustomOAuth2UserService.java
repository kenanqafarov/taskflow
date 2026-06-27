package com.ironhack.trelloforween.security;

import com.ironhack.trelloforween.entity.User;
import com.ironhack.trelloforween.entity.Role;
import com.ironhack.trelloforween.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);

        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");
        String picture = oAuth2User.getAttribute("picture");
        String provider = userRequest.getClientRegistration().getRegistrationId();
        String providerId = oAuth2User.getName(); // Usually sub or id

        Optional<User> userOptional = userRepository.findByEmail(email);

        User user;

        if (userOptional.isPresent()) {
            user = userOptional.get();
            user.setName(name);
            user.setProfilePicture(picture);
            user = userRepository.save(user);
        } else {
            user = new User();
            user.setEmail(email);
            user.setUsername(email);
            user.setName(name);
            user.setProfilePicture(picture);
            user.setProvider(provider);
            user.setProviderId(providerId);
            user.setRole(Role.MEMBER);
            user.setActive(true);
            user = userRepository.save(user);
        }

        return oAuth2User; // We return the default OAuth2User. If we need custom Principal, we can wrap it.
    }
}
