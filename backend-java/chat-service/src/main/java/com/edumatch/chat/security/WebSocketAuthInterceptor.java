package com.edumatch.chat.security;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
@RequiredArgsConstructor
@Slf4j
public class WebSocketAuthInterceptor implements ChannelInterceptor {

    private final JwtTokenProvider tokenProvider;

    @Value("${app.jwt.prefix}")
    private String headerPrefix; // Bearer

    // Tên header mà client (STOMP) sẽ gửi token
    // (Khớp với tài liệu yêu cầu "TOKEN_AUTH")
    private static final String AUTH_HEADER = "TOKEN_AUTH";

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor =
                MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        // 1. Chỉ kiểm tra khi client gửi lệnh CONNECT
        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            log.info("WebSocketAuth: Đang xử lý kết nối STOMP...");

            // 2. Lấy token từ header "TOKEN_AUTH"
            String authHeader = accessor.getFirstNativeHeader(AUTH_HEADER);
            String jwt = getJwtFromHeader(authHeader);

            // 3. Xác thực token
            if (StringUtils.hasText(jwt) && tokenProvider.validateToken(jwt)) {
                // 4. Lấy thông tin xác thực
                Authentication authentication = tokenProvider.getAuthentication(jwt);

                // 5. Lưu thông tin xác thực vào SecurityContext (cho phiên WebSocket này)
                SecurityContextHolder.getContext().setAuthentication(authentication);
                accessor.setUser(authentication); // Quan trọng

                log.info("WebSocketAuth: Xác thực thành công user: {}", authentication.getName());
            } else {
                log.warn("WebSocketAuth: Xác thực thất bại. Token thiếu hoặc không hợp lệ.");
                // (Bạn có thể ném ra lỗi ở đây để từ chối kết nối)
                // throw new SecurityException("Không thể xác thực WebSocket. Token không hợp lệ.");
            }
        }
        return message;
    }

    // Hàm helper để trích xuất token từ "Bearer <token>"
    private String getJwtFromHeader(String bearerToken) {
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith(headerPrefix + " ")) {
            return bearerToken.substring(headerPrefix.length() + 1);
        }
        return null;
    }
}