package com.campusafety.system.config;

import com.campusafety.system.entity.User;
import com.campusafety.system.enums.Role;
import com.campusafety.system.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class SystemAdminSeeder {

    @Bean
    CommandLineRunner seedSystemAdmin(UserRepository userRepository,
                                      PasswordEncoder passwordEncoder) {
        return args -> {
            String email = "sysadmin@campus.com";

            if (userRepository.findByEmail(email).isEmpty()) {
                User user = new User();
                user.setName("System Admin");
                user.setEmail(email);
                user.setPassword(passwordEncoder.encode("Admin@123"));
                user.setRole(Role.SYSTEM_ADMIN);
                user.setActive(true);

                userRepository.save(user);
            }
        };
    }
}