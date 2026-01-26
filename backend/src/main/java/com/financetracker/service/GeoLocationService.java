package com.financetracker.service;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.concurrent.CompletableFuture;

@Service
@RequiredArgsConstructor
@Slf4j
public class GeoLocationService {

    private static final String IP_API_URL = "http://ip-api.com/json/";
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();

    @Async
    public CompletableFuture<String> getLocationAsync(String ip) {
        return CompletableFuture.supplyAsync(() -> getLocation(ip));
    }

    public String getLocation(String ip) {
        // Skip private/local IPs
        if (isPrivateIp(ip)) {
            return "Local Network";
        }

        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(IP_API_URL + ip + "?fields=status,city,regionName,country"))
                    .timeout(Duration.ofSeconds(5))
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                IpApiResponse apiResponse = objectMapper.readValue(response.body(), IpApiResponse.class);
                if ("success".equals(apiResponse.getStatus())) {
                    return formatLocation(apiResponse);
                }
            }
        } catch (Exception e) {
            log.warn("Failed to get location for IP {}: {}", ip, e.getMessage());
        }

        return null;
    }

    private boolean isPrivateIp(String ip) {
        if (ip == null || ip.isEmpty()) return true;
        return ip.equals("127.0.0.1") ||
               ip.equals("0:0:0:0:0:0:0:1") ||
               ip.equals("::1") ||
               ip.startsWith("192.168.") ||
               ip.startsWith("10.") ||
               ip.startsWith("172.16.") ||
               ip.startsWith("172.17.") ||
               ip.startsWith("172.18.") ||
               ip.startsWith("172.19.") ||
               ip.startsWith("172.20.") ||
               ip.startsWith("172.21.") ||
               ip.startsWith("172.22.") ||
               ip.startsWith("172.23.") ||
               ip.startsWith("172.24.") ||
               ip.startsWith("172.25.") ||
               ip.startsWith("172.26.") ||
               ip.startsWith("172.27.") ||
               ip.startsWith("172.28.") ||
               ip.startsWith("172.29.") ||
               ip.startsWith("172.30.") ||
               ip.startsWith("172.31.");
    }

    private String formatLocation(IpApiResponse response) {
        StringBuilder sb = new StringBuilder();
        // Use regionName (prefecture/state) instead of city
        if (response.getRegionName() != null && !response.getRegionName().isEmpty()) {
            sb.append(response.getRegionName());
        }
        if (response.getCountry() != null && !response.getCountry().isEmpty()) {
            if (sb.length() > 0) sb.append(", ");
            sb.append(response.getCountry());
        }
        return sb.length() > 0 ? sb.toString() : null;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    private static class IpApiResponse {
        private String status;
        private String city;
        private String regionName;
        private String country;
    }
}
