FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build-api

WORKDIR /src
COPY Discapp.API/*.csproj .
RUN dotnet restore
COPY Discapp.API .
RUN dotnet publish -c Release -o /publish

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build-worker

WORKDIR /src
COPY Discapp.Worker/*.csproj .
RUN dotnet restore
COPY Discapp.Worker .
RUN dotnet publish -c Release -o /publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime

WORKDIR /app
COPY --from=build-api    /publish ./api
COPY --from=build-worker /publish ./wrk

EXPOSE 8080

CMD ["sh", "-c", "dotnet api/Discapp.API.dll & dotnet wrk/Discapp.Worker.dll"]
