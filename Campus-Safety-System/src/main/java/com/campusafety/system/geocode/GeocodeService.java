package com.campusafety.system.geocode;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class GeocodeService {

    private final RestTemplate rest = new RestTemplate();

    @Value("${geocode.nominatim.email:}")
    private String contactEmail;

    // very small simple cache to avoid hammering Nominatim in development
    private static class CacheEntry {
        public final String json;
        public final Instant ts;
        CacheEntry(String json) { this.json = json; this.ts = Instant.now(); }
    }

    private final ConcurrentHashMap<String, CacheEntry> cache = new ConcurrentHashMap<>();

    private String cachedGet(String key, String url) {
        // cache TTL 60s (tweak as needed)
        CacheEntry e = cache.get(key);
        if (e != null && Instant.now().minusSeconds(60).isBefore(e.ts)) {
            return e.json;
        }
        HttpHeaders headers = new HttpHeaders();
        // identify yourself per Nominatim usage policy
        headers.set("User-Agent", "campus-safety-backend/1.0 (" + (contactEmail.isBlank() ? "no-email" : contactEmail) + ")");
        HttpEntity<Void> request = new HttpEntity<>(headers);
        try {
            ResponseEntity<String> resp = rest.exchange(url, HttpMethod.GET, request, String.class);
            if (resp.getStatusCode().is2xxSuccessful() && resp.getBody() != null) {
                cache.put(key, new CacheEntry(resp.getBody()));
                return resp.getBody();
            }
            return "[]";
        } catch (org.springframework.web.client.HttpClientErrorException.TooManyRequests e1) {
            return "[]";
        } catch (Exception e1) {
            return "[]";
        }

    }

    public String search(String q) {
        String url = "https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&addressdetails=1&q=" + java.net.URLEncoder.encode(q, java.nio.charset.StandardCharsets.UTF_8);
        if (!contactEmail.isBlank()) url += "&email=" + java.net.URLEncoder.encode(contactEmail, java.nio.charset.StandardCharsets.UTF_8);
        return cachedGet("s:" + q, url);
    }

    public String reverse(double lat, double lon) {
        String key = "r:" + lat + "," + lon;
        String url = String.format("https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=%s&lon=%s&addressdetails=1", lat, lon);
        if (!contactEmail.isBlank()) url += "&email=" + java.net.URLEncoder.encode(contactEmail, java.nio.charset.StandardCharsets.UTF_8);
        return cachedGet(key, url);
    }
}