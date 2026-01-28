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

        int port = mailProperties.getPort();
        boolean useSSL = (port == 465);

        JavaMailSenderImpl mailSender = new JavaMailSenderImpl();
        mailSender.setHost(host);
        mailSender.setPort(port);
        mailSender.setUsername(username);
        mailSender.setPassword(mailProperties.getPassword());

        Properties props = mailSender.getJavaMailProperties();

        if (useSSL) {
            // Port 465 - Use SMTPS (SSL)
            props.put("mail.transport.protocol", "smtps");
            props.put("mail.smtps.auth", "true");
            props.put("mail.smtps.ssl.enable", "true");
            props.put("mail.smtps.ssl.trust", host);
            props.put("mail.smtps.connectiontimeout", "10000");
            props.put("mail.smtps.timeout", "10000");
            props.put("mail.smtps.writetimeout", "10000");
            log.info("Using SMTPS (SSL) for port 465");
        } else {
            // Port 587 - Use SMTP with STARTTLS
            props.put("mail.transport.protocol", "smtp");
            props.put("mail.smtp.auth", "true");
            props.put("mail.smtp.starttls.enable", "true");
            props.put("mail.smtp.starttls.required", "true");
            props.put("mail.smtp.connectiontimeout", "10000");
            props.put("mail.smtp.timeout", "10000");
            props.put("mail.smtp.writetimeout", "10000");
            log.info("Using SMTP with STARTTLS for port {}", port);
        }

        props.put("mail.debug", "true");

        log.info("JavaMailSender configured - Host: {}, Port: {}, User: {}, SSL: {}",
            host, port, username, useSSL);
        return mailSender;
    }
}
