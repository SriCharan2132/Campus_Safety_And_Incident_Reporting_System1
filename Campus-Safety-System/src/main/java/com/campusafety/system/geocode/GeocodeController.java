package com.campusafety.system.geocode;

import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import org.springframework.beans.factory.annotation.Autowired;

@RestController
@RequestMapping("/api/geocode")
public class GeocodeController {

    private final GeocodeService geocodeService;

    @Autowired
    public GeocodeController(GeocodeService geocodeService) {
        this.geocodeService = geocodeService;
    }

    @GetMapping("/search")
    public ResponseEntity<Object> search(@RequestParam("q") String q) {
        String out = geocodeService.search(q);
        if (out == null) return ResponseEntity.status(502).body("{\"error\":\"geocode backend error\"}");
        return ResponseEntity.ok(out);
    }

    @GetMapping("/reverse")
    public ResponseEntity<Object> reverse(@RequestParam("lat") double lat, @RequestParam("lon") double lon) {
        String out = geocodeService.reverse(lat, lon);
        if (out == null) return ResponseEntity.status(502).body("{\"error\":\"geocode backend error\"}");
        return ResponseEntity.ok(out);
    }
}