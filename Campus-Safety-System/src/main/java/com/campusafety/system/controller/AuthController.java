package com.campusafety.system.controller;

import com.campusafety.system.dto.LoginRequest;
import com.campusafety.system.dto.LoginResponse;
import com.campusafety.system.entity.User;
import com.campusafety.system.exception.AuthenticationFailedException;
import com.campusafety.system.security.JwtUtil;
import com.campusafety.system.service.UserService;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService userService;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;

    public AuthController(UserService userService,
                          JwtUtil jwtUtil,
                          PasswordEncoder passwordEncoder) {
        this.userService = userService;
        this.jwtUtil = jwtUtil;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping("/login")
    public LoginResponse login(@RequestBody LoginRequest request) {

        User user = userService.findByEmail(request.getEmail())
                .orElseThrow(() ->
                        new AuthenticationFailedException(
                                "Invalid email or password"
                        ));
        if (!user.isActive()) {
            throw new BadCredentialsException("User account is inactive");
        }
        if (!passwordEncoder.matches(
                request.getPassword(),
                user.getPassword())) {

            throw new AuthenticationFailedException(
                    "Invalid email or password"
            );
        }
        if (!user.isActive()) {
            throw new AuthenticationFailedException("Account is disabled");
        }

        String token = jwtUtil.generateToken(
        	    user.getId(),                 // ✅ ADD THIS
        	    user.getEmail(),
        	    user.getRole().name()
        	);

        return new LoginResponse(token);
    }
}