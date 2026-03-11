# EduMatch

EduMatch la mot he thong microservices phuc vu nen tang ket noi hoc bong, ung tuyen va matching giua nguoi dung, nha tuyen dung va co hoi hoc bong.

## Kien truc chinh

Du an gom cac thanh phan sau:

- `frontend`: Next.js frontend
- `backend-java/auth-service`: Spring Boot auth service
- `backend-java/scholarship-service`: Spring Boot scholarship service
- `backend-java/chat-service`: Spring Boot chat service
- `matching-service`: Python FastAPI matching service
- `nginx-gateway`: API gateway
- `rabbitmq`: message broker
- `mysql/postgres`: databases cho tung service

## Yeu cau truoc khi chay

Can cai san:

- `Git`
- `Docker Desktop`
- Ket noi Internet on dinh de Docker pull image lan dau

Khuyen nghi:

- RAM toi thieu `8GB`
- O cung con trong it nhat `10GB`

Neu chay bang Docker thi khong can cai rieng:

- Node.js
- Java
- Maven
- Python
- MySQL
- PostgreSQL
- RabbitMQ

## Clone du an

```bash
git clone https://github.com/hieumous/edumatch-test.git
cd edumatch-test
```

## File can bo sung thu cong

### Firebase key cho chat-service

Repo khong luu file secret cua Firebase. De `chat-service` khoi dong duoc, can tu tai Firebase Admin SDK JSON va dat vao dung duong dan:

```text
backend-java/chat-service/src/main/resources/firebase-adminsdk-key.json
```

Neu thieu file nay, `chat-service` se loi khi boot.

## Cach chay du an bang Docker

Tu thu muc goc cua repo:

```bash
docker compose up -d --build
```

Lan dau co the hoi lau vi Docker phai tai image va build service.

## Kiem tra da len het chua

```bash
docker compose ps
```

Xem log neu can:

```bash
docker compose logs -f auth-service
docker compose logs -f scholarship-service
docker compose logs -f chat-service
docker compose logs -f frontend
docker compose logs -f matching-service
docker compose logs -f api-gateway
```

## URL sau khi chay

- Frontend: `http://localhost:3000`
- API Gateway: `http://localhost:8080`
- Auth service: `http://localhost:8081`
- Scholarship service: `http://localhost:8082`
- Chat service: `http://localhost:8083`
- Matching service: `http://localhost:8000`
- RabbitMQ UI: `http://localhost:15672`

Thong tin dang nhap RabbitMQ:

- Username: `guest`
- Password: `guest`

## Tai khoan admin mac dinh

He thong tu tao tai khoan admin khi `auth-service` khoi dong lan dau:

- Username: `admin`
- Password: `admin123`

## Cac cong local can de trong

Du an su dung cac port:

- `3000` frontend
- `8000` matching-service
- `8080` api-gateway
- `8081` auth-service
- `8082` scholarship-service
- `8083` chat-service
- `8084` websocket/chat
- `3307` auth database
- `3308` scholarship database
- `3309` chat database
- `5432` matching database
- `5672` RabbitMQ
- `15672` RabbitMQ dashboard

Neu may dang co app khac chiem cac cong nay, Docker co the khong len duoc.

## Chay lai sau khi pull code moi

```bash
git pull
docker compose up -d --build
```

Neu chi restart:

```bash
docker compose restart
```

Nhung neu source code da doi, nen uu tien `up -d --build`.

## Dung du an

Dung container:

```bash
docker compose down
```

Dung va xoa volume database:

```bash
docker compose down -v
```

Luu y: `down -v` se xoa du lieu database local.

## Checklist test nhanh sau khi chay

1. Mo `http://localhost:3000`
2. Dang nhap bang `admin / admin123`
3. Vao admin dashboard
4. Kiem tra scholarship list
5. Kiem tra chat/messages
6. Kiem tra RabbitMQ UI tai `http://localhost:15672`

## Loi thuong gap

### 1. Docker Desktop chua chay

Neu gap loi lien quan den `dockerDesktopLinuxEngine`, hay mo Docker Desktop truoc roi chay lai lenh compose.

### 2. Docker Hub timeout

Neu gap `TLS handshake timeout`, thu pull tay cac image base:

```bash
docker pull node:18-alpine
docker pull maven:3.9.2-eclipse-temurin-17
docker pull maven:3.9-eclipse-temurin-17
docker pull eclipse-temurin:17-jdk
docker pull eclipse-temurin:17-jre-alpine
docker pull python:3.10-slim
docker pull mysql:8.0
docker pull postgres:14-alpine
docker pull rabbitmq:3-management-alpine
docker pull nginx:alpine
```

Sau do chay lai:

```bash
docker compose up -d --build
```

### 3. Chat service khong len

Kiem tra da dat file:

```text
backend-java/chat-service/src/main/resources/firebase-adminsdk-key.json
```

### 4. Frontend vao duoc nhung API loi

Kiem tra:

- `auth-service`
- `scholarship-service`
- `chat-service`
- `api-gateway`

bang lenh:

```bash
docker compose ps
```

## Ghi chu

- Frontend dang chay o dev mode trong Docker de de test va hot reload.
- Repo khong chua file secret local.
- Khong commit them file `.env.local`, `firebase-adminsdk-key.json`, `target/`, `node_modules/` len repo.
