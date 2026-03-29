package com.campusafety.system.config;

import org.springframework.http.server.ServerHttpRequest;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.support.DefaultHandshakeHandler;

import java.security.Principal;
import java.util.Map;

public class CustomHandshakeHandler extends DefaultHandshakeHandler {

    @Override
    protected Principal determineUser(
            ServerHttpRequest request,
            WebSocketHandler wsHandler,
            Map<String, Object> attributes) {

        // look for our "user" attribute (set by HandshakeInterceptor),
        // or a previously stored SPRING.PRINCIPAL
        Object userAttr = attributes.get("user");
        if (userAttr == null) {
            userAttr = attributes.get("SPRING.PRINCIPAL");
        }

        if (userAttr instanceof Principal p) {
            return p;
        }

        if (userAttr instanceof String email && !email.isBlank()) {
            return () -> email;
        }

        return super.determineUser(request, wsHandler, attributes);
    }
}