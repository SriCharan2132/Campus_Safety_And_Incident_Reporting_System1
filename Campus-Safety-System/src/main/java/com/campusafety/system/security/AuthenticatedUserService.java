package com.campusafety.system.security;

import com.campusafety.system.entity.User;
import com.campusafety.system.exception.ResourceNotFoundException;
import com.campusafety.system.service.UserService;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
public class AuthenticatedUserService {

    private final UserService userService;

    public AuthenticatedUserService(UserService userService) {
        this.userService = userService;
    }

    public User getCurrentUser() {

        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        String email = authentication.getName();

        return userService.findByEmail(email)
                .orElseThrow(() ->
                        new ResourceNotFoundException("User not found"));
    }
}