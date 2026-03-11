package com.edumatch.chat.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    // Tên Exchange chung (khớp với tất cả các service)
    public static final String EXCHANGE_NAME = "events_exchange";
    // Tên Queue cho service này
    public static final String NOTIFICATION_QUEUE = "notification_queue";

    // Lắng nghe: notification.send.email, scholarship.new.match, notification.application.status
    public static final String EMAIL_ROUTING_KEY = "notification.send.email";
    public static final String MATCH_ROUTING_KEY = "scholarship.new.match";
    public static final String APPLICATION_STATUS_ROUTING_KEY = "notification.application.status";
    public static final String SCHOLARSHIP_CREATED_KEY = "scholarship.created";
    public static final String SCHOLARSHIP_UPDATED_KEY = "scholarship.updated";

    @Bean
    public TopicExchange exchange() {
        // Topic Exchange là bắt buộc cho việc routing key pattern (user.#)
        return new TopicExchange(EXCHANGE_NAME, true, false);
    }

    @Bean
    public Queue notificationQueue() {
        // Tạo Queue, durable = true để tin nhắn không bị mất khi RabbitMQ khởi động lại
        return new Queue(NOTIFICATION_QUEUE, true);
    }

    // --- Bindings ---

    @Bean
    public Binding emailBinding(Queue notificationQueue, TopicExchange exchange) {
        // Bind key: notification.send.email
        return BindingBuilder.bind(notificationQueue).to(exchange).with(EMAIL_ROUTING_KEY);
    }

    @Bean
    public Binding matchBinding(Queue notificationQueue, TopicExchange exchange) {
        // Bind key: scholarship.new.match
        return BindingBuilder.bind(notificationQueue).to(exchange).with(MATCH_ROUTING_KEY);
    }

    @Bean
    public Binding applicationStatusBinding(Queue notificationQueue, TopicExchange exchange) {
        // Bind key: notification.application.status
        return BindingBuilder.bind(notificationQueue).to(exchange).with(APPLICATION_STATUS_ROUTING_KEY);
    }

    @Bean
    public Binding scholarshipCreatedBinding(Queue notificationQueue, TopicExchange exchange) {
        // Bind key: scholarship.created
        return BindingBuilder.bind(notificationQueue).to(exchange).with(SCHOLARSHIP_CREATED_KEY);
    }

    @Bean
    public Binding scholarshipUpdatedBinding(Queue notificationQueue, TopicExchange exchange) {
        // Bind key: scholarship.updated
        return BindingBuilder.bind(notificationQueue).to(exchange).with(SCHOLARSHIP_UPDATED_KEY);
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
        // Cần để xử lý JSON objects gửi từ các service Java/Python khác
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory) {
        final RabbitTemplate rabbitTemplate = new RabbitTemplate(connectionFactory);
        rabbitTemplate.setMessageConverter(jsonMessageConverter());
        return rabbitTemplate;
    }
}