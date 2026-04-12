FROM maven:3.9.11-eclipse-temurin-25 AS build
WORKDIR /workspace

COPY pom.xml .
COPY src src

RUN mvn -B -DskipTests package

FROM eclipse-temurin:25-jre
WORKDIR /app

RUN addgroup --system boatgroup && adduser --system --ingroup boatgroup boatuser

COPY --from=build /workspace/target/*.jar app.jar

USER boatuser

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
