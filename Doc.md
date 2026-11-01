1. Môi trường Development (Làm việc cục bộ trên máy)
Khi bạn sửa file schema.prisma (thêm bảng, thêm cột, đổi quan hệ), bạn có 2 hướng tùy theo nhu cầu:

Cách 1: Migrate chuẩn có lưu lịch sử (Khuyên dùng nhất)
Bash
npx prisma migrate dev --name <ten_mo_ta_thay_doi>
Ví dụ: npx prisma migrate dev --name add_role_and_student_table

Lệnh này làm gì?

Tự động so sánh schema.prisma với PostgreSQL hiện tại.

Tạo ra một file mã SQL thuần trong thư mục prisma/migrations/ để lưu lại vết lịch sử thay đổi cấu trúc database.

Chạy file SQL đó vào PostgreSQL.

Tự động chạy luôn lệnh npx prisma generate để cập nhật TypeScript types cho VS Code.

Cách 2: Đẩy trực tiếp không cần lưu lịch sử (Prototype / Test nhanh)
Bash
npx prisma db push
Lệnh này làm gì? Ép cấu trúc mới thẳng vào DB mà không sinh file migration.

Cờ ép thay đổi khi bị xung đột/mất dữ liệu cũ:

npx prisma db push --accept-data-loss: Chấp nhận mất dữ liệu ở các cột/bảng bị chỉnh sửa.

npx prisma db push --force-reset: Xóa sạch toàn bộ dữ liệu trong database và dựng lại schema từ đầu.

2. Môi trường Production / Kubernetes (Khi deploy thật)
Trên production hoặc khi pod Kubernetes khởi động, bạn tuyệt đối không chạy migrate dev hay db push. Bạn sử dụng lệnh:

Bash
npx prisma migrate deploy
Lệnh này làm gì? Quét toàn bộ các file SQL trong thư mục prisma/migrations/ (đã commit lên Git) và áp dụng những file chưa chạy vào database. Lệnh này không bao giờ tự ý sửa đổi schema hay xóa dữ liệu nếu không có file migration tương ứng.

3. Đồng bộ lại TypeScript sau khi chỉnh sửa
Bất cứ khi nào bạn sửa schema.prisma hoặc vừa migrate xong mà thấy VS Code báo lỗi đỏ ở các model/thuộc tính mới, hãy chạy lệnh:

Bash
npx prisma generate
Lệnh này tái tạo lại thư viện @prisma/client để code TypeScript của bạn nhận diện chính xác các trường dữ liệu mới.