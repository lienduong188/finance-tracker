# Build stage
FROM maven:3.9-eclipse-temurin-17-alpine AS build
WORKDIR /app
COPY pom.xml .
ENV MAVEN_OPTS="-Xmx512m -Xms256m"
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn package -DskipTests -B -q

# Run stage
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Create non-root user
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-Xmx256m", "-Xms128m", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=65.0", "-XX:+UseSerialGC", "-Dspring.profiles.active=prod", "-jar", "app.jar"]
