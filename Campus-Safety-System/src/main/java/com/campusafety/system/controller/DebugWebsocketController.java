package com.campusafety.system.controller;

import org.springframework.messaging.simp.user.SimpUser;
import org.springframework.messaging.simp.user.SimpUserRegistry;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.stream.Collectors;

@RestController
public class DebugWebsocketController {

    private final SimpUserRegistry simpUserRegistry;

    public DebugWebsocketController(SimpUserRegistry simpUserRegistry) {
        this.simpUserRegistry = simpUserRegistry;
    }

    @GetMapping("/api/debug/ws-users")
    public Object wsUsers() {
        return simpUserRegistry.getUsers().stream().map(user -> {
            return user.getName() + " -> subs: " + user.getSessions().stream()
                    .flatMap(s -> s.getSubscriptions().stream())
                    .map(sub -> sub.getDestination())
                    .collect(Collectors.toList());
        }).collect(Collectors.toList());
    }
}