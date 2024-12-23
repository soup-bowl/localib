FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build-api

WORKDIR /src
COPY Discapp.API/*.csproj Discapp.API/
COPY Discapp.Shared/*.csproj Discapp.Shared/

RUN dotnet restore "Discapp.API/Discapp.API.csproj"
COPY . . 
RUN dotnet publish "Discapp.API/Discapp.API.csproj" -c Release -o /publish

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build-worker

WORKDIR /src
COPY Discapp.Worker/*.csproj Discapp.Worker/
COPY Discapp.Shared/*.csproj Discapp.Shared/
RUN dotnet restore "Discapp.Worker/Discapp.Worker.csproj"
COPY . .
RUN dotnet publish "Discapp.Worker/Discapp.Worker.csproj" -c Release -o /publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime

WORKDIR /app
COPY --from=build-api    /publish ./api
COPY --from=build-worker /publish ./wrk

RUN addgroup --system discapp && adduser --system --ingroup discapp discapp
RUN chown -R discapp:discapp /app

USER discapp

EXPOSE 8080

CMD ["sh", "-c", "dotnet api/Discapp.API.dll & dotnet wrk/Discapp.Worker.dll"]
