# Hướng Dẫn Thiết Lập & Phát Triển Dự Án Glassic (Dành Cho Thành Viên Mới)

Tài liệu này hướng dẫn chi tiết từng bước cho các lập trình viên khi kéo mã nguồn (`git clone`) dự án **Glassic** về máy cá nhân để tiếp tục phát triển cả phân hệ **Backend** và **Frontend**.

---

## 1. Yêu Cầu Tiên Quyết (Prerequisites)

Trước khi bắt đầu, đảm bảo máy của bạn đã cài đặt sẵn các công cụ sau:
1. **Node.js**: Phiên bản LTS (khuyên dùng Node 18, 20 hoặc 22) kèm `npm`.
2. **PostgreSQL**: Cài đặt trên máy host (chạy tại cổng mặc định `5432`) hoặc qua Docker.
3. **Docker Desktop** (hoặc Minikube / K3s):
   - Đã bật tính năng **Kubernetes** trong Docker Desktop Settings.
4. **Ingress-NGINX Controller**: Đã được kích hoạt / cài đặt trên cụm Kubernetes:
   ```bash
   kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.2/deploy/static/provider/cloud/deploy.yaml
   ```
5. **Skaffold** *(khuyên dùng)*: Công cụ tự động hóa build & sync code lên Kubernetes khi lưu file.

---

## 2. Bước 1: Cấu Hình Domain Ảo (`glassic.dev`)

Dự án sử dụng NGINX Ingress Controller để định tuyến domain `glassic.dev` về cụm Kubernetes cục bộ:
- Mọi request `https://glassic.dev/api/users/*` -> Chuyển về **Server Pod** (`server-srv:3000`).
- Mọi request `https://glassic.dev/*` -> Chuyển về **Client Pod** (`client-srv:3000`).

### Cách cấu hình file `hosts`:
- **Trên Windows**: Mở **Notepad** bằng quyền **Run as Administrator**, mở file:
  `C:\Windows\System32\drivers\etc\hosts`
- **Trên macOS / Linux**: Mở terminal chạy lệnh:
  `sudo nano /etc/hosts`

Thêm dòng sau vào cuối file rồi lưu lại:
```text
127.0.0.1 glassic.dev
```

---

## 3. Bước 2: Thiết Lập Cơ Sở Dữ Liệu & Môi Trường

### 2.1. Tạo Database trên PostgreSQL
Mở pgAdmin, DBeaver hoặc terminal `psql` và tạo cơ sở dữ liệu:
```sql
CREATE DATABASE glassic_db;
```

### 2.2. Hiểu rõ về chuỗi kết nối Database (`DATABASE_URL`)
- **Khi chạy code trực tiếp trên máy (Host)**: DB nằm tại `localhost:5432`.
- **Khi chạy trong Pod Kubernetes**: Pod là container biệt lập nên `localhost` sẽ trỏ vào chính container đó. Để từ container kết nối ngược ra PostgreSQL trên máy tính của bạn, cần dùng `host.docker.internal:5432`.
- *Lưu ý về URL Encoding*: Nếu mật khẩu có chứa ký tự đặc biệt, cần mã hóa (VD: `#` thành `%23`, `@` thành `%40`).

### 2.3. Tạo file cấu hình `server/.env`
Tạo file `server/.env` để phục vụ công cụ Prisma và kiểm thử local:
```env
DATABASE_URL="postgresql://<db_user>:<db_password>@localhost:5432/glassic_db?schema=public"
JWT_KEY="chuoi_bi_mat_tuy_y_it_nhat_8_ky_tu"
```

---

## 4. Bước 3: Tạo Kubernetes Secrets (Bắt Buộc)

Kubernetes Deployment (`infra/k8s/server-depl.yaml`) cần 2 secret để khởi động server và chạy Prisma migration tự động:

Chạy 2 lệnh sau trong terminal:

```bash
# 1. Tạo JWT Secret
kubectl create secret generic jwt-secret --from-literal=JWT_KEY=chuoi_bi_mat_tuy_y_it_nhat_8_ky_tu

# 2. Tạo Database Secret (Lưu ý: Dùng host.docker.internal để pod kết nối ra máy host)
kubectl create secret generic db-secret --from-literal=DATABASE_URL="postgresql://<db_user>:<db_password>@host.docker.internal:5432/glassic_db?schema=public"
```

> **Ghi chú**: Nếu bạn đã tạo secret trước đó và muốn sửa lại mật khẩu/URL:
> ```bash
> kubectl delete secret db-secret
> kubectl create secret generic db-secret --from-literal=DATABASE_URL="..."
> ```

---

## 5. Bước 4: Cài Đặt Thư Viện & Khởi Tạo Database

### 5.1. Cài đặt Backend (`server`)
Mở terminal và di chuyển vào thư mục `server`:
```bash
cd server
npm install

# Tạo Prisma Client và đồng bộ bảng vào cơ sở dữ liệu
npx prisma generate
npx prisma migrate dev
```

### 5.2. Cài đặt Frontend (`client`)
Mở một terminal khác và di chuyển vào thư mục `client`:
```bash
cd client
npm install
```

---

## 6. Bước 5: Khởi Chạy Ứng Dụng

Có 2 cách để khởi chạy dự án:

### Cách 1: Sử dụng Skaffold (Khuyên Dùng Nhất Cho Phát Triển)
Tại thư mục gốc của dự án (`Glassic-ver2`), chạy:
```bash
skaffold dev
```
**Cơ chế hoạt động của Skaffold:**
1. Tự động build Docker Image cho `server` và `client`.
2. Áp dụng toàn bộ cấu hình Kubernetes trong `infra/k8s/`.
3. Init Container sẽ tự động chạy `npx prisma migrate deploy` để đảm bảo DB luôn khớp schema.
4. **Live Sync**: Khi bạn chỉnh sửa code `.ts` trong `server/src` hoặc `.js` trong `client`, Skaffold đồng bộ trực tiếp vào container đang chạy mà không cần build lại toàn bộ image từ đầu.
5. Khi bạn nhấn `Ctrl + C`, Skaffold sẽ tự động dọn dẹp và xóa các deployment/service liên quan.

---

### Cách 2: Sử dụng lệnh Docker & `kubectl` thủ công
Nếu không dùng Skaffold, bạn có thể build và deploy từng phần:

1. **Build Docker images**:
   ```bash
   docker build -t xenlulozo/glassic-server ./server
   docker build -t xenlulozo/glassic-client-v2 ./client
   ```

2. **Áp dụng manifests vào Kubernetes**:
   ```bash
   kubectl apply -f ./infra/k8s/
   ```

3. **Kiểm tra trạng thái các Pod**:
   ```bash
   kubectl get pods
   ```
   Chờ cho đến khi cả `client-depl-...` và `server-depl-...` đều ở trạng thái `Running` (1/1).

---

## 7. Bước 6: Truy Cập & Kiểm Thử Ứng Dụng

1. Mở trình duyệt web và truy cập địa chỉ:
   ```text
   https://glassic.dev
   ```
   > **Cảnh báo SSL Self-Signed**: Do Ingress sử dụng chứng chỉ tự ký cục bộ, trình duyệt sẽ báo cảnh báo bảo mật. Bạn chỉ cần bấm **Advanced (Nâng cao)** -> **Proceed to glassic.dev (Tiếp tục truy cập)** hoặc gõ cụm từ `thisisunsafe` trên cửa sổ Chrome.

2. **Khởi tạo tài khoản Quản trị viên**:
   - Truy cập `https://glassic.dev/auth/signup` để tạo tài khoản Admin ban đầu.
   - Sau khi tạo thành công, hệ thống sẽ đăng nhập và đưa bạn vào **Màn hình bảng điều khiển Quản trị viên (Admin Dashboard)**.

3. **Các tính năng hiện có của Admin Dashboard**:
   - **Quản lý Lớp học** (`/?tab=classes`): Xem danh sách lớp, lọc theo khối, tìm kiếm, tạo lớp học mới.
   - **Quản lý Giáo viên** (`/?tab=teachers`): Xem danh sách giáo viên, tra cứu thông tin liên hệ, tạo tài khoản giáo viên mới.
   - **Quản lý Học sinh** (`/?tab=students`): Xem danh sách học sinh, mã học sinh, tài khoản định danh, tạo mới học sinh.
   - **Tổng quan** (`/?tab=overview`): Báo cáo số liệu tổng hợp về quy mô trường học.

---

## 8. Quy Chuẩn & Kiến Trúc Dự Án Khi Code Tiếp

### 8.1. Cấu trúc mã nguồn Backend (`server/`)
- `src/index.ts`: File khởi động ứng dụng, thiết lập cookie session, kết nối database, nạp middleware `currentUser2` và đăng ký các route.
- `src/routes/auth/`: Các route liên quan đến xác thực (`signup.ts`, `signin.ts`, `signout.ts`, `current-user.ts`).
- `src/routes/teacher-management/`: Các route chuyên biệt về nghiệp vụ giáo viên (`index.ts`).
- `src/routes/student-management/`: Các route chuyên biệt về nghiệp vụ học sinh (`index.ts`).
- `src/service/prisma.ts`: Quản lý instance Prisma Client dùng chung cho toàn bộ server.
- `prisma/schema.prisma`: Định nghĩa bảng, quan hệ giữa các model (`User`, `Teacher`, `Student`).
- **Quy tắc**: Khi bổ sung chức năng mới (ví dụ: quản lý điểm, môn học), hãy tạo folder nghiệp vụ riêng trong `src/routes/<tên-nghiệp-vụ>/` thay vì viết dồn vào một file.

### 8.2. Cấu trúc mã nguồn Frontend (`client/`)
- `src/components/Header.js`: Thanh điều hướng đầu trang hiển thị thông tin đăng nhập/đăng xuất theo vai trò.
- `src/components/admin/`: Chứa các component chức năng của trang Quản trị:
  - `AdminDashboard.js`: Khung điều phối trung tâm.
  - `AdminSidebar.js`: Thanh menu bên trái.
  - `ClassManagementView.js`, `TeacherManagementView.js`, `StudentManagementView.js`, `OverviewView.js`.
- `src/pages/index.js`: Trang chủ (Hiển thị Landing Page nếu chưa đăng nhập, tự động chuyển về Dashboard tương ứng theo Role).
- `src/pages/auth/`: Màn hình Đăng nhập (`signin.js`) và Đăng ký (`signup.js`).
- **Định hướng thiết kế UI**:
  - Giao diện Admin hướng tới sự **tối giản, chuyên nghiệp, rõ ràng, dễ nhìn**.
  - **Không sử dụng icon/emoji** trang trí.
  - **Không lạm dụng bo cong lớn** (`rounded-4`, `rounded-pill`), chỉ dùng bo nhẹ tinh tế (`rounded-1` từ 2–4px), đường viền sắc nét (`border`), màu trung tính.

---

## 9. Các Lỗi Thường Gặp & Cách Khắc Phục (Troubleshooting)

### 1. Ingress trả về lỗi `502 Bad Gateway`
- **Nguyên nhân**: Pod `server-depl` đang bị lỗi khởi động (CrashLoopBackOff) hoặc chưa sẵn sàng nhận kết nối.
- **Cách xử lý**:
  ```bash
  kubectl get pods
  kubectl logs -l app=server --tail=50
  ```
  Kiểm tra log xem có lỗi kết nối cơ sở dữ liệu (`Can't reach database server at host.docker.internal:5432`) hay không. Nếu có, hãy kiểm tra lại PostgreSQL trên máy host và secret `db-secret`.

### 2. Lỗi Prisma "Database does not exist" hoặc lệch cấu trúc bảng
- **Cách xử lý**:
  Tại thư mục `server`:
  ```bash
  npx prisma migrate dev
  npx prisma generate
  ```
  Nếu đang dùng Kubernetes, hãy restart lại deployment để pod chạy lại initContainer migration:
  ```bash
  kubectl rollout restart deployment server-depl
  ```

### 3. VS Code báo lỗi đỏ TypeScript ở các model Prisma vừa thêm
- **Cách xử lý**:
  Chạy lệnh cập nhật type:
  ```bash
  cd server
  npx prisma generate
  ```
  Sau đó mở Command Palette trong VS Code (`Ctrl + Shift + P`) -> chọn **TypeScript: Restart TS Server**.

