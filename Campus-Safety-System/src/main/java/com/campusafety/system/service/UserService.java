package com.campusafety.system.service;

import com.campusafety.system.entity.User;
import com.campusafety.system.enums.Role;
import com.campusafety.system.exception.BusinessException;
import com.campusafety.system.exception.ResourceNotFoundException;
import com.campusafety.system.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.List;

import com.campusafety.system.dto.CreateUserRequestDTO;
import com.campusafety.system.dto.UpdateUserRequestDTO;
import com.campusafety.system.dto.UserDTO;
import com.campusafety.system.dto.UserManagementResponseDTO;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public UserManagementResponseDTO createManagedUser(CreateUserRequestDTO request) {

        if (request.getRole() == Role.SYSTEM_ADMIN) {
            throw new BusinessException("SYSTEM_ADMIN cannot be created from user management screen");
        }

        if (request.getEmail() == null || request.getEmail().isBlank()) {
            throw new BusinessException("Email must not be empty");
        }

        if (request.getPassword() == null || request.getPassword().isBlank()) {
            throw new BusinessException("Password must not be empty");
        }

        if (request.getRole() == null) {
            throw new BusinessException("Role must not be empty");
        }

        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new BusinessException("Email already registered");
        }

        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail().trim().toLowerCase());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(request.getRole());
        user.setActive(request.getActive() == null || request.getActive());

        User saved = userRepository.save(user);
        return toManagementDTO(saved);
    }

    @Transactional(readOnly = true)
    public List<UserManagementResponseDTO> getAllUsers() {
        return userRepository.findAll()
                .stream()
                .filter(user -> user.getRole() != Role.SYSTEM_ADMIN)
                .map(this::toManagementDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<UserManagementResponseDTO> getUsersByRole(Role role) {
        return userRepository.findByRole(role)
                .stream()
                .filter(user -> user.getRole() != Role.SYSTEM_ADMIN)
                .map(this::toManagementDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public UserManagementResponseDTO getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (user.getRole() == Role.SYSTEM_ADMIN) {
            throw new BusinessException("Cannot view SYSTEM_ADMIN");
        }

        return toManagementDTO(user);
    }

    @Transactional
    public UserManagementResponseDTO updateUser(Long id, UpdateUserRequestDTO request) {

        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (user.getRole() == Role.SYSTEM_ADMIN) {
            throw new BusinessException("Cannot modify SYSTEM_ADMIN");
        }

        if (request.getEmail() != null && !request.getEmail().isBlank()) {
            String newEmail = request.getEmail().trim().toLowerCase();
            Optional<User> existing = userRepository.findByEmail(newEmail);
            if (existing.isPresent() && !existing.get().getId().equals(id)) {
                throw new BusinessException("Email already registered");
            }
            user.setEmail(newEmail);
        }

        if (request.getName() != null && !request.getName().isBlank()) {
            user.setName(request.getName().trim());
        }

        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        if (request.getRole() != null) {
            if (request.getRole() == Role.SYSTEM_ADMIN) {
                throw new BusinessException("SYSTEM_ADMIN role cannot be assigned here");
            }
            user.setRole(request.getRole());
        }

        if (request.getActive() != null) {
            user.setActive(request.getActive());
        }

        return toManagementDTO(userRepository.save(user));
    }

    @Transactional
    public void deactivateUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (user.getRole() == Role.SYSTEM_ADMIN) {
            throw new BusinessException("Cannot modify SYSTEM_ADMIN");
        }

        if (!user.isActive()) {
            throw new BusinessException("User is already inactive");
        }

        user.setActive(false);
        userRepository.save(user);
    }

    @Transactional
    public void activateUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (user.getRole() == Role.SYSTEM_ADMIN) {
            throw new BusinessException("Cannot modify SYSTEM_ADMIN");
        }

        if (user.isActive()) {
            throw new BusinessException("User is already active");
        }

        user.setActive(true);
        userRepository.save(user);
    }

    private UserManagementResponseDTO toManagementDTO(User user) {
        return new UserManagementResponseDTO(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole(),
                user.isActive()
        );
    }

    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public Optional<User> findById(Long id) {
        return userRepository.findById(id);
    }

    public User createUser(User user) {

        if (user.getEmail() == null || user.getEmail().isBlank()) {
            throw new BusinessException("Email must not be empty");
        }

        if (user.getPassword() == null || user.getPassword().isBlank()) {
            throw new BusinessException("Password must not be empty");
        }

        if (userRepository.findByEmail(user.getEmail()).isPresent()) {
            throw new BusinessException("Email already registered");
        }

        if (user.getRole() == null) {
            user.setRole(Role.STUDENT);
        }

        user.setActive(true);
        user.setPassword(passwordEncoder.encode(user.getPassword()));

        return userRepository.save(user);
    }

    public List<UserDTO> getSecurityUsers() {
        return userRepository.findByRole(Role.SECURITY)
                .stream()
                .map(user -> new UserDTO(
                        user.getId(),
                        user.getName(),
                        user.getEmail()
                ))
                .toList();
    }
}