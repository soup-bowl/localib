ARG DOTNET_VERSION=8.0
ARG BASE_VARIANT=bookworm-slim

FROM --platform=$BUILDPLATFORM mcr.microsoft.com/dotnet/sdk:${DOTNET_VERSION}-${BASE_VARIANT} AS build-api
ARG TARGETARCH

WORKDIR /src
COPY Discapp.API/*.csproj Discapp.API/
COPY Discapp.Shared/*.csproj Discapp.Shared/

RUN dotnet restore "Discapp.API/Discapp.API.csproj" -a "$TARGETARCH"
COPY . . 
RUN dotnet publish "Discapp.API/Discapp.API.csproj" -a "$TARGETARCH" -c Release -o /publish

FROM --platform=$BUILDPLATFORM mcr.microsoft.com/dotnet/sdk:${DOTNET_VERSION}-${BASE_VARIANT} AS build-worker
ARG TARGETARCH

WORKDIR /src
COPY Discapp.Worker/*.csproj Discapp.Worker/
COPY Discapp.Shared/*.csproj Discapp.Shared/

RUN dotnet restore "Discapp.Worker/Discapp.Worker.csproj" -a "$TARGETARCH"
COPY . .
RUN dotnet publish "Discapp.Worker/Discapp.Worker.csproj" -a "$TARGETARCH" -c Release -o /publish

FROM mcr.microsoft.com/dotnet/aspnet:${DOTNET_VERSION}-${BASE_VARIANT} AS runtime

WORKDIR /app
COPY --from=build-api    /publish ./api
COPY --from=build-worker /publish ./wrk

ENV LOCALIB_IMAGE_PATH=/Images
VOLUME ["${LOCALIB_IMAGE_PATH}"]

EXPOSE 8080

CMD ["sh", "-c", "dotnet api/Discapp.API.dll & dotnet wrk/Discapp.Worker.dll"]
