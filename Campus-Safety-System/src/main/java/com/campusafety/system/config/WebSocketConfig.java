// src/main/java/com/campusafety/system/config/WebSocketConfig.java
package com.campusafety.system.config;

import com.campusafety.system.security.WebSocketAuthInterceptor;
import com.campusafety.system.security.WebSocketHandshakeInterceptor;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final WebSocketAuthInterceptor authInterceptor;
    private final WebSocketHandshakeInterceptor handshakeInterceptor;

    public WebSocketConfig(
            WebSocketAuthInterceptor authInterceptor,
            WebSocketHandshakeInterceptor handshakeInterceptor) {

        this.authInterceptor = authInterceptor;
        this.handshakeInterceptor = handshakeInterceptor;
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // simple broker for topic and queue; /user is resolved to sessions
        config.enableSimpleBroker("/topic", "/queue");
        config.setApplicationDestinationPrefixes("/app");
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .addInterceptors(handshakeInterceptor)
                .setHandshakeHandler(new CustomHandshakeHandler())
                .withSockJS();
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(authInterceptor);
    }
}