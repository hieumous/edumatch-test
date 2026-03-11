package com.edumatch.chat.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

@Configuration
public class AppConfig {

    /**
     * Tạo một bean RestTemplate để thực hiện các cuộc gọi HTTP
     * (Ví dụ: gọi sang Auth-Service)
     */
    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}