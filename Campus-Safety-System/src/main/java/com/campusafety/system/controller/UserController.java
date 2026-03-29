package com.campusafety.system.controller;

import com.campusafety.system.dto.UserDTO;
import com.campusafety.system.service.UserService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    // ADMIN → Get all security officers
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/security")
    public List<UserDTO> getSecurityUsers() {

        return userService.getSecurityUsers();
    }
}