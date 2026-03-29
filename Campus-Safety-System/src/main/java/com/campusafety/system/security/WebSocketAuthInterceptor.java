// src/main/java/com/campusafety/system/security/WebSocketAuthInterceptor.java
package com.campusafety.system.security;

import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Component;

import com.campusafety.system.service.UserService;

import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.messaging.simp.stomp.StompCommand;
import java.util.List;
import java.util.Map;
import org.springframework.security.core.context.SecurityContextHolder;

@Component
public class WebSocketAuthInterceptor implements ChannelInterceptor {

    private final JwtUtil jwtUtil;
    private final UserService userService;

    public WebSocketAuthInterceptor(JwtUtil jwtUtil, UserService userService) {
        this.jwtUtil = jwtUtil;
        this.userService = userService;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(message);
        
        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            String authHeader = accessor.getFirstNativeHeader("Authorization");
            if (authHeader == null) {
                authHeader = accessor.getFirstNativeHeader("authorization");
            }

            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                System.out.println("WS CONNECT missing Authorization header -> rejecting connection");
                throw new RuntimeException("Missing or invalid Authorization header");
            }

            String token = authHeader.substring(7);
            if (!jwtUtil.validateToken(token)) {
                System.out.println("WS CONNECT invalid JWT -> rejecting connection");
                throw new RuntimeException("Invalid JWT token");
            }

            String email = jwtUtil.extractUsername(token);
            String role = jwtUtil.extractRole(token);

            // Build an Authentication where principal.getName() returns the email.
            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(
                            email,
                            null,
                            List.of(new SimpleGrantedAuthority("ROLE_" + role))
                    );

            // Set authentication as the STOMP user/principal
            accessor.setUser(authentication);
            SecurityContextHolder.getContext().setAuthentication(authentication);
            System.out.println("WS Principal name = " + authentication.getName());
            System.out.println("WS auth - setting principal for STOMP session: " + email + " accessor.getUser() -> " + accessor.getUser());
            // Also set SecurityContext so server-side code can access authentication if needed
            SecurityContextHolder.getContext().setAuthentication(authentication);

            // Propagate minimal session attrs for CustomHandshakeHandler fallback (optional)
            Map<String, Object> sessionAttributes = accessor.getSessionAttributes();
            if (sessionAttributes != null) {
                sessionAttributes.putIfAbsent("user", authentication.getName());
                sessionAttributes.putIfAbsent("SPRING.PRINCIPAL", authentication);
            }
            
            System.out.println("WS Connected user: " + email);
        }

        return message;
    }
}