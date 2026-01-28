package com.financetracker.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.autoconfigure.mail.MailProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;

import java.util.Properties;

@Configuration
@EnableConfigurationProperties(MailProperties.class)
@Slf4j
public class MailConfig {

    @Bean
    @ConditionalOnProperty(name = "spring.mail.host", matchIfMissing = false)
    public JavaMailSender javaMailSender(MailProperties mailProperties) {
        // Check if SMTP is properly configured
        String host = mailProperties.getHost();
        String username = mailProperties.getUsername();

        if (host == null || host.trim().isEmpty()) {
            log.warn("SMTP_HOST not configured. Email sending disabled.");
            return null;
        }

        if (username == null || username.trim().isEmpty()) {
            log.warn("SMTP_USER not configured. Email sending disabled.");
            return null;
        }

        JavaMailSenderImpl mailSender = new JavaMailSenderImpl();
        mailSender.setHost(host);
        mailSender.setPort(mailProperties.getPort());
        mailSender.setUsername(username);
        mailSender.setPassword(mailProperties.getPassword());

        Properties props = mailSender.getJavaMailProperties();
        props.put("mail.transport.protocol", "smtp");
        props.put("mail.smtp.auth", "true");
        props.put("mail.smtp.starttls.enable", "true");
        props.put("mail.smtp.starttls.required", "true");
        props.put("mail.smtp.connectiontimeout", "5000");
        props.put("mail.smtp.timeout", "5000");
        props.put("mail.smtp.writetimeout", "5000");
        props.put("mail.debug", "true");  // Enable debug for troubleshooting

        log.info("JavaMailSender configured - Host: {}, Port: {}, User: {}",
            host, mailProperties.getPort(), username);
        return mailSender;
    }
}
