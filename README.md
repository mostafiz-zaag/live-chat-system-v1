# Nest Backend Template

## Requirements to Run

- Docker
- Docker Compose
- Configure docker compose environment file

```bash
      SERVER_PORT: 7000
```

## Docker

* Build image:

```bash
docker compose -f your_compose_file build
```

* Run image as docker container:

```bash
docker compose -f your_compose_file up

-----------------------
OR Run with detached mode:
-----------------------

docker compose -f your_compose_file up -d
```

* Down the running container:

```bash
docker compose -f your_compose_file down