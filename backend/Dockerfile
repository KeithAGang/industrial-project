FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY Nepsis.Api/Nepsis.Api.csproj Nepsis.Api/
RUN dotnet restore Nepsis.Api/Nepsis.Api.csproj
COPY . .
RUN dotnet publish Nepsis.Api/Nepsis.Api.csproj -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production
# Demo API key (free tier) — replace with your own key for production
ENV Gemini__ApiKey=AIzaSyDoVEcVJsjaLh90ZzB3akYxvPbq6f0vfqQ
ENV Gemini__Enabled=true
ENTRYPOINT ["dotnet", "Nepsis.Api.dll"]
