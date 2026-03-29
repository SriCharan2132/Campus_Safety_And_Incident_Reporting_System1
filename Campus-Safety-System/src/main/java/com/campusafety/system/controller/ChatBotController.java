package com.campusafety.system.controller;



import com.campusafety.system.dto.ChatRequest;
import com.campusafety.system.dto.ChatResponse;
import com.campusafety.system.service.ChatBotService;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/chatbot")
public class ChatBotController {

    private final ChatBotService chatBotService;

    public ChatBotController(ChatBotService chatBotService) {
        this.chatBotService = chatBotService;
    }

    @PostMapping("/message")
    public ChatResponse chat(@RequestBody ChatRequest request,
                             Authentication authentication) {

        String role = authentication.getAuthorities().toString();

        String reply = chatBotService.getResponse(request.getMessage(), role);

        return new ChatResponse(reply);
    }
}