package com.campusafety.system.controller;

import com.campusafety.system.dto.CreateUserRequestDTO;
import com.campusafety.system.dto.UpdateUserRequestDTO;
import com.campusafety.system.dto.UserManagementResponseDTO;
import com.campusafety.system.enums.Role;
import com.campusafety.system.service.UserService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/system-admin/users")
@PreAuthorize("hasRole('SYSTEM_ADMIN')")
public class SystemAdminUserController {

    private final UserService userService;

    public SystemAdminUserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping
    public UserManagementResponseDTO createUser(@Valid @RequestBody CreateUserRequestDTO request) {
        return userService.createManagedUser(request);
    }

    @GetMapping
    public List<UserManagementResponseDTO> getAllUsers(@RequestParam(required = false) Role role) {
        if (role != null) {
            return userService.getUsersByRole(role);
        }
        return userService.getAllUsers();
    }

    @GetMapping("/{id}")
    public UserManagementResponseDTO getUserById(@PathVariable Long id) {
        return userService.getUserById(id);
    }

    @PutMapping("/{id}")
    public UserManagementResponseDTO updateUser(@PathVariable Long id,
                                                 @RequestBody UpdateUserRequestDTO request) {
        return userService.updateUser(id, request);
    }

    @PatchMapping("/{id}/activate")
    public void activateUser(@PathVariable Long id) {
        userService.activateUser(id);
    }

    @PatchMapping("/{id}/deactivate")
    public void deactivateUser(@PathVariable Long id) {
        userService.deactivateUser(id);
    }
}