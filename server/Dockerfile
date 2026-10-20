FROM gradle:8.14.3-jdk21 AS build
WORKDIR /app
# 의존성 레이어를 먼저 받아 캐시한다 (소스만 바뀌면 재다운로드하지 않음)
COPY settings.gradle.kts build.gradle.kts ./
RUN gradle dependencies --no-daemon -q > /dev/null
COPY src ./src
RUN gradle bootJar --no-daemon -q

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/build/libs/*.jar app.jar
EXPOSE 8000
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
