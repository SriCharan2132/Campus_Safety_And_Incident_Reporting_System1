package com.campusafety.system.logging;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.MDC;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

@Component
public class RequestCorrelationFilter extends OncePerRequestFilter {

    public static final String CORRELATION_ID_KEY = "correlationId";

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain)
            throws ServletException, IOException {

        String correlationId = UUID.randomUUID().toString();

        // Add to logging context
        MDC.put(CORRELATION_ID_KEY, correlationId);

        // Add to response header
        response.setHeader("X-Correlation-Id", correlationId);

        try {
            filterChain.doFilter(request, response);
        } finally {
            MDC.clear();
        }
    }
}