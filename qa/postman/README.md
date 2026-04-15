## Postman collections (EduMatch)

Thư mục này chứa Postman collection + environment để chạy smoke/regression qua API Gateway.

### Files

- `EduMatch.local.smoke.postman_collection.json`: **smoke collection tối thiểu** (gateway health, login, me, scholarships search) chạy được local qua gateway.
- `EduMatch.full.regression.postman_collection.json`: collection đầy đủ (từ file bạn gửi) đã **chuẩn hoá một số điểm để chạy local** (login mặc định, signup username 6 ký tự, bỏ hardcode token/opportunityId ở Create Application).
- `Edumatch.local.postman_environment.json`: environment local đã set `base_url`.

### Local base URL

Repo đang chạy gateway ở:

- `http://localhost:8080`

Environment `Edumatch.local...` đã set:

- `base_url = http://localhost:8080`

### Cách chạy nhanh (Postman UI)

1. Import collection `EduMatch.local.smoke...`
2. Import environment `Edumatch.local...`
3. Chọn environment `Edumatch (local)`
4. Chạy theo thứ tự:
   - Health → Gateway Health
   - Auth → Login (admin/admin123) (lấy `accessToken`)
   - Auth → Get Me (auth-service)
   - Scholarships → Search Scholarships (public)

### Chạy full regression (khuyến nghị)

1. Import collection `EduMatch.full.regression...`
2. Chọn environment `Edumatch (local)`
3. Chạy tối thiểu theo thứ tự để set biến:
   - Auth → Login
   - Auth → Get Me (Auth) (set `userId`, `applicantId`)
   - Scholarships & Opportunities → Search Scholarships (set `opportunityId`)
4. Sau đó mới chạy các nhóm phụ thuộc `opportunityId`/token như Bookmarks, Applications, Matching, Chat.

### Lưu ý các chỗ dễ fail (để mình fix ở bước tiếp theo nếu bạn muốn)

- **Các flow “đầy đủ”** (admin CRUD, application, chat, matching…) cần seed data và/hoặc role cụ thể; mình sẽ đưa collection “full regression” vào repo ở đợt kế tiếp sau khi mình chuẩn hoá lại các biến (không hardcode token/opportunityId).

