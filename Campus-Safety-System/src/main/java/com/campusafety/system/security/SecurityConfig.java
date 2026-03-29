package com.campusafety.system.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final JwtAuthenticationEntryPoint authenticationEntryPoint;
    private final JwtAccessDeniedHandler accessDeniedHandler;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter,
            JwtAuthenticationEntryPoint authenticationEntryPoint,
            JwtAccessDeniedHandler accessDeniedHandler) {
			this.jwtAuthenticationFilter = jwtAuthenticationFilter;
			this.authenticationEntryPoint = authenticationEntryPoint;
			this.accessDeniedHandler = accessDeniedHandler;
	}

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {

    	http
    	.cors(cors -> {})
        .csrf(csrf -> csrf.disable())
        .exceptionHandling(exception -> exception
                .authenticationEntryPoint(authenticationEntryPoint)
                .accessDeniedHandler(accessDeniedHandler)
        )
        .authorizeHttpRequests(auth -> auth
                .requestMatchers(
                        "/api/auth/login",
                        "/ws/**",
                        "/h2-console/**",
                        "/ws-test.html",
                        "/ws-debug.html",
                        "/", "/index.html", "/sos-test.html", "/static/**","/api/media/**","/api/geocode/**","/api/chatbot/**"
                ).permitAll()
                .anyRequest().authenticated()
        )
        .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
        );

        // Allow H2 console frames
        http.headers(headers -> headers.frameOptions(frame -> frame.disable()));

        // Attach JWT filter
        http.addFilterBefore(
                jwtAuthenticationFilter,
                UsernamePasswordAuthenticationFilter.class
        );

        return http.build();
    }

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration config
    ) throws Exception {
        return config.getAuthenticationManager();
    }
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}