package com.campusafety.system.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;

@Component
public class JwtUtil {

    private static final Logger logger =
            LoggerFactory.getLogger(JwtUtil.class);

    private final String SECRET =
            "ThisIsASecretKeyForCampusSafetySystemJWTAuth123456";

    private final long EXPIRATION = 24*1000 * 60 * 60; // 1 hour

    private Key getSigningKey() {
        return Keys.hmacShaKeyFor(SECRET.getBytes());
    }

    public String generateToken(Long userId, String username, String role) {

        return Jwts.builder()
                .setSubject(username)
                .claim("id", userId)          // ✅ ADD THIS
                .claim("role", role)
                .setIssuedAt(new Date())
                .setExpiration(
                        new Date(System.currentTimeMillis() + EXPIRATION)
                )
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public String extractUsername(String token) {
        return getClaims(token).getSubject();
    }

    public String extractRole(String token) {
        return getClaims(token).get("role", String.class);
    }

    public boolean validateToken(String token) {

        try {
            getClaims(token);
            return true;

        } catch (ExpiredJwtException ex) {
            logger.warn("JWT expired: {}", ex.getMessage());
        } catch (UnsupportedJwtException ex) {
            logger.warn("Unsupported JWT: {}", ex.getMessage());
        } catch (MalformedJwtException ex) {
            logger.warn("Malformed JWT: {}", ex.getMessage());
        } catch (SecurityException ex) {
            logger.warn("Invalid JWT signature: {}", ex.getMessage());
        } catch (IllegalArgumentException ex) {
            logger.warn("JWT token is empty or null");
        }

        return false;
    }

    private Claims getClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }
    public Long extractUserId(String token) {
        return getClaims(token).get("id", Long.class);
    }
}