## QA automation & regression (EduMatch)

Mục tiêu của thư mục `qa/` là gom các artefact kiểm thử (test inventory, Postman smoke/regression, report mẫu) để sau khi code xong có thể test lại hệ thống theo rủi ro và có bằng chứng rõ ràng.

### Quick start (local)

- **Chạy hệ thống**: dùng `docker-compose.yml` ở root.
- **Base URL gateway**: `http://localhost:8080`
- **Smoke API**: chạy Postman collection trong `qa/postman/` (sẽ được bổ sung ở đợt tiếp theo).

### Cấu trúc thư mục

- `qa/test-inventory/`: ma trận truy vết requirement → testcase → API/UI → evidence
- `qa/postman/`: collection + environment cho smoke/regression API
- `qa/reports/`: output/report (csv/json/md) sinh ra từ chạy test (local/CI)

### Quy ước evidence (bằng chứng test)

Mỗi testcase khi chạy (manual hoặc automation) nên có ít nhất:

- **ID testcase**: ví dụ `AUTH-SMOKE-001`
- **Environment**: `local` / `dev` / `staging`
- **Bước test**: input chính + endpoint/route
- **Kết quả**: status code + dữ liệu chính (ẩn/che secrets)
- **Log/screenshot** (nếu có)
- **Link bug/ticket** (nếu fail)

