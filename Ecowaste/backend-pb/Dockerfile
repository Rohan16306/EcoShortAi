FROM alpine:latest

ARG PB_VERSION=0.22.0

RUN apk add --no-cache \
    unzip \
    ca-certificates

# Download and install PocketBase
ADD https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip /tmp/pb.zip
RUN unzip /tmp/pb.zip -d /pb/

# Copy the local database data into the container
# Note: On Render, if you attach a persistent disk to /pb/pb_data, it will hide this copied data.
# For a simple prototype without a persistent disk, this works perfectly.
COPY pb_data /pb/pb_data/
COPY pb_migrations /pb/pb_migrations/

EXPOSE 8090

# Start PocketBase
CMD ["/pb/pocketbase", "serve", "--http=0.0.0.0:8090"]
