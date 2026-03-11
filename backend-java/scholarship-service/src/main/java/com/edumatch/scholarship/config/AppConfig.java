package com.edumatch.scholarship.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

@Configuration
public class AppConfig {

    /**
     * Tạo một bean RestTemplate để thực hiện các cuộc gọi HTTP giữa các service.
     * Spring sẽ quản lý bean này và tiêm nó vào những nơi cần thiết.
     * @return Một đối tượng RestTemplate.
     */
    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}