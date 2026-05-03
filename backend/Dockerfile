# ══════════════════════════════════════════════
# Stage 1: Build
# ══════════════════════════════════════════════
FROM eclipse-temurin:17-jdk-alpine AS builder
WORKDIR /app

# Install maven (no mvnw in repo — use system maven)
RUN apk add --no-cache maven

# Cache dependencies layer — only re-runs when pom.xml changes
COPY pom.xml .
RUN mvn -B dependency:go-offline -q

# Build the app
COPY src ./src
RUN mvn -B clean package -Dmaven.test.skip=true -q

# ══════════════════════════════════════════════
# Stage 2: Runtime (slim)
# ══════════════════════════════════════════════
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

RUN addgroup -S shopwave && adduser -S shopwave -G shopwave

COPY --from=builder /app/target/shopwave-backend-*.jar app.jar

RUN chown shopwave:shopwave app.jar
USER shopwave

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget -qO- http://localhost:8080/api/actuator/health || exit 1

ENTRYPOINT ["java", \
  "-XX:+UseContainerSupport", \
  "-XX:MaxRAMPercentage=75.0", \
  "-XX:+UseG1GC", \
  "-Djava.security.egd=file:/dev/./urandom", \
  "-jar", "app.jar"]