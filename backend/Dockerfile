FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY LifecycleIQ.Api/LifecycleIQ.Api.csproj LifecycleIQ.Api/
RUN dotnet restore LifecycleIQ.Api/LifecycleIQ.Api.csproj
COPY . .
RUN dotnet publish LifecycleIQ.Api/LifecycleIQ.Api.csproj -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production
# Demo API key (free tier) — replace with your own key for production
ENV Gemini__ApiKey=AIzaSyDoVEcVJsjaLh90ZzB3akYxvPbq6f0vfqQ
ENV Gemini__Enabled=true
ENTRYPOINT ["dotnet", "LifecycleIQ.Api.dll"]
