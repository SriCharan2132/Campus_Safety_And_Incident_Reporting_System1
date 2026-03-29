package com.campusafety.system.security;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.server.*;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.*;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.net.URI;
import java.util.List;
import java.util.Map;

@Component
public class WebSocketHandshakeInterceptor implements HandshakeInterceptor {

    @Autowired
    private JwtUtil jwtUtil;

    @Override
    public boolean beforeHandshake(
            ServerHttpRequest request,
            ServerHttpResponse response,
            WebSocketHandler wsHandler,
            Map<String, Object> attributes) {

        String token = null;

        // 1) Try HTTP Authorization header (may be absent for SockJS)
        if (request instanceof ServletServerHttpRequest servletRequest) {
            HttpServletRequest servletReq = servletRequest.getServletRequest();
            String authHeader = servletReq.getHeader("Authorization");
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                token = authHeader.substring(7);
            }

            // 2) If no header, try query param "token"
            if (token == null) {
                String query = servletReq.getQueryString();
                if (query != null) {
                    // simple parse for token param
                    for (String pair : query.split("&")) {
                        String[] kv = pair.split("=", 2);
                        if (kv.length == 2 && "token".equals(kv[0])) {
                            token = java.net.URLDecoder.decode(kv[1], java.nio.charset.StandardCharsets.UTF_8);
                            break;
                        }
                    }
                }
            }
        } else {
            // Fallback: attempt to parse token from URI query
            URI uri = request.getURI();
            if (uri != null && uri.getQuery() != null) {
                for (String pair : uri.getQuery().split("&")) {
                    String[] kv = pair.split("=", 2);
                    if (kv.length == 2 && "token".equals(kv[0])) {
                        token = java.net.URLDecoder.decode(kv[1], java.nio.charset.StandardCharsets.UTF_8);
                        break;
                    }
                }
            }
        }

        if (token != null && jwtUtil.validateToken(token)) {
            String email = jwtUtil.extractUsername(token);
            // store for CustomHandshakeHandler
            attributes.put("user", email);
        }

        return true;
    }

    @Override
    public void afterHandshake(
            ServerHttpRequest request,
            ServerHttpResponse response,
            WebSocketHandler wsHandler,
            Exception exception) { }
}