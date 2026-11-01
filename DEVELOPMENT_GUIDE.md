# Cẩm Nang Phát Triển Tính Năng, API & Cấu Trúc Mã Nguồn (Development Guide)

Tài liệu này hướng dẫn chi tiết cách tổ chức mã nguồn, phân chia thư mục, cách tận dụng các hàm/dịch vụ bổ trợ đã có sẵn ở Backend và cách làm việc với các file đặc biệt ở Frontend khi mở rộng dự án **Glassic**.

---

## MỤC LỤC
1. [Quy Chuẩn Phân Chia Thư Mục (Folder Structure)](#1-quy-chuẩn-phân-chia-thư-mục-folder-structure)
2. [Các Hàm Bổ Trợ Sẵn Có Ở Backend & Cách Sử Dụng](#2-các-hàm-bổ-trợ-sẵn-có-ở-backend--cách-sử-dụng)
3. [Các File Đặc Biệt Ở Frontend Cần Chú Ý](#3-các-file-đặc-biệt-ở-frontend-cần-chú-ý)
4. [Lưu Ý Sống Còn Về Ingress Controller Khi Thêm API](#4-lưu-ý-sống-còn-về-ingress-controller-khi-thêm-api)
5. [Quy Trình Mẫu: Thêm Một Nghiệp Vụ Mới Từ A Đến Z](#5-quy-trình-mẫu-thêm-một-nghiệp-vụ-mới-từ-a-đến-z)

---

## 1. Quy Chuẩn Phân Chia Thư Mục (Folder Structure)

### 1.1. Phía Backend (`server/src/`)

```text
server/src/
├── index.ts                      # Điểm khởi động Express app, nạp middleware, mount routes
├── middlewares/                  # Các middleware kiểm tra phân quyền, xác thực
│   └── require-admin.ts          # Middleware chặn request không phải ADMIN
├── routes/                       # Phân tách theo từng miền nghiệp vụ (Domain-driven)
│   ├── auth/                     # Phân hệ Xác thực tài khoản
│   │   ├── signup.ts             # Đăng ký Admin, tạo Teacher/Student (Kèm tài khoản)
│   │   ├── signin.ts             # Đăng nhập (Student, Teacher, Admin)
│   │   ├── signout.ts            # Đăng xuất (Xóa session cookie)
│   │   └── current-user.ts       # Trả về thông tin user đang đăng nhập
│   ├── teacher-management/       # Phân hệ Quản lý Giáo viên
│   │   └── index.ts              # API danh sách, tìm kiếm, cập nhật giáo viên
│   └── student-management/       # Phân hệ Quản lý Học sinh
│       └── index.ts              # API danh sách, tìm kiếm, cập nhật học sinh
└── service/                      # Các dịch vụ dùng chung (Business logic & Utility)
    ├── prisma.ts                 # Prisma Client Singleton instance
    ├── password.ts               # Mã hóa Scrypt + Salt & So sánh mật khẩu an toàn
    └── user-service.ts           # Xử lý logic người dùng (Sinh UserID ngẫu nhiên duy nhất)
```

**Quy tắc khi tạo API mới:**
- **Không nhồi nhét** tất cả API vào một file lớn.
- Với mỗi nghiệp vụ mới (VD: Quản lý môn học, Điểm số, Thời khóa biểu), tạo một folder mới:
  `server/src/routes/<tên-nghiệp-vụ>/index.ts`
- Khởi tạo Express Router, viết các endpoint và export router đó.
- Mount router mới vào `server/src/index.ts`.

---

### 1.2. Phía Frontend (`client/src/`)

```text
client/src/
├── api/
│   └── build-client.js           # Helper quan trọng tạo Axios instance cho cả SSR và Browser
├── components/
│   ├── Header.js                 # Navbar chung, hiển thị thông tin & nút bấm theo role
│   └── admin/                    # Các view/component con thuộc màn hình Quản trị viên
│       ├── AdminDashboard.js     # Khung chính điều phối Sidebar và Content
│       ├── AdminSidebar.js       # Menu điều hướng bên trái
│       ├── ClassManagementView.js# Giao diện quản lý Lớp học
│       ├── TeacherManagementView.js # Giao diện quản lý Giáo viên
│       ├── StudentManagementView.js # Giao diện quản lý Học sinh
│       └── OverviewView.js       # Giao diện Tổng quan & Báo cáo số liệu
├── hooks/
│   └── use-request.js            # Custom React Hook chuẩn hóa việc gọi API và bắt lỗi
└── pages/                        # File-based Routing của Next.js
    ├── _app.js                   # Root Component chạy SSR lấy currentUser
    ├── index.js                  # Trang chủ (Hiển thị Dashboard hoặc Landing Page)
    ├── auth/                     # Các trang xác thực toàn màn hình
    │   ├── signin.js             # Màn hình đăng nhập
    │   ├── signup.js             # Màn hình đăng ký Admin
    │   └── signout.js            # Màn hình xử lý đăng xuất
    └── admin/                    # Các trang form chuyên sâu nếu cần tách trang riêng
        ├── create-teacher.js
        └── create-student.js
```

**Quy tắc phân loại giao diện:**
- **Dạng 1 (Tab trong Dashboard)**: Nếu tính năng thuộc phạm vi quản trị thường nhật (xem danh sách, lọc, thống kê, thao tác nhanh) -> Tạo thành Component bên trong `src/components/admin/<TênView>.js` và nạp vào `AdminDashboard.js`.
- **Dạng 2 (Trang độc lập - Standalone Page)**: Nếu luồng nghiệp vụ dài, nhiều bước phức tạp hoặc dành riêng cho người dùng chưa đăng nhập -> Tạo file mới trong `src/pages/...`.

---

## 2. Các Hàm Bổ Trợ Sẵn Có Ở Backend & Cách Sử Dụng

Dự án đã xây dựng sẵn nhiều dịch vụ và hàm bổ trợ chuẩn. Khi viết API mới, bạn chỉ cần tái sử dụng mà không cần tự viết lại:

### 2.1. Thao tác Cơ sở dữ liệu: `prisma`
File: `server/src/service/prisma.ts`
Dự án sử dụng cơ chế **Singleton** để tránh việc tạo quá nhiều kết nối kết nối trùng lặp tới PostgreSQL.

```ts
import { prisma } from '../../service/prisma.js';

// Ví dụ: Truy vấn danh sách
const teachers = await prisma.teacher.findMany({
    orderBy: { teacherId: 'asc' }
});

// Ví dụ: Tạo mới bản ghi
const newClass = await prisma.class.create({
    data: { id: '10A1', name: 'Lớp 10A1' }
});
```

---

### 2.2. Kiểm tra quyền Quản trị viên: `requireAdmin`
File: `server/src/middlewares/require-admin.ts`
Middleware này tự động kiểm tra xem request có cookie JWT hợp lệ và vai trò có phải là `ADMIN` hay không. Nếu không thỏa mãn, tự động quăng lỗi `401 Unauthorized` (`NotAuthorizedError`).

```ts
import express from 'express';
import { requireAdmin } from '../../middlewares/require-admin.js';

const router = express.Router();

// Chỉ Admin mới được gọi API này:
router.get('/api/users/classes', requireAdmin, async (req, res) => {
    // Logic an toàn ở đây...
    res.send({ status: 'ok' });
});
```

---

### 2.3. Lấy thông tin tài khoản đang gọi API: `req.currentUser2`
Middleware `currentUser2` từ `@xen-tickets/common` đã được đăng ký toàn cục tại `index.ts`. Trong bất kỳ controller nào, bạn có thể đọc trực tiếp:

```ts
router.get('/api/users/profile', async (req, res) => {
    if (!req.currentUser2) {
        // Chưa đăng nhập
    }
    
    // Đã đăng nhập, đối tượng chứa:
    const { id, userId, username, role } = req.currentUser2;
    console.log(`Người dùng ${username} (Role: ${role}) vừa thực hiện hành động`);
});
```

---

### 2.4. Xử lý lỗi chuẩn HTTP: `@xen-tickets/common`
Hệ thống sử dụng thư viện `express-async-errors`. Trong các hàm `async`, bạn **không cần viết try/catch** để `res.status(400).send(...)`. Hãy ném trực tiếp Error Class tương ứng, hệ thống sẽ tự bắt và trả về cấu trúc `{ errors: [{ message: "..." }] }`:

```ts
import { BadRequestError, NotFoundError, NotAuthorizedError } from '@xen-tickets/common';

// Báo lỗi dữ liệu không hợp lệ (HTTP 400):
if (!req.body.name) {
    throw new BadRequestError("Tên lớp học không được để trống");
}

// Báo lỗi không tìm thấy tài nguyên (HTTP 404):
const student = await prisma.student.findUnique({ where: { studentId } });
if (!student) {
    throw new NotFoundError();
}

// Báo lỗi không có quyền truy cập (HTTP 401):
if (user.role !== 'ADMIN') {
    throw new NotAuthorizedError();
}
```

---

### 2.5. Mã hóa & So khớp mật khẩu: `Password`
File: `server/src/service/password.ts`
Sử dụng thuật toán **Scrypt** kèm **Salt 16 bytes** ngẫu nhiên và so khớp bằng hàm chống tấn công đo lường thời gian (`timingSafeEqual`):

```ts
import { Password } from '../../service/password.js';

// 1. Khi tạo user mới (Băm mật khẩu):
const hashedPassword = await Password.toHash(req.body.password);

// 2. Khi đăng nhập (So sánh mật khẩu):
const isMatch = await Password.compare(user.password, req.body.password);
if (!isMatch) {
    throw new BadRequestError("Mật khẩu không chính xác");
}
```

---

### 2.6. Tự động sinh mã UserID duy nhất: `UserService`
File: `server/src/service/user-service.ts`
Tạo mã UserID 6 ký tự hex ngắn gọn, tiện lợi cho việc tra cứu và đảm bảo 100% không trùng trong bảng `User`:

```ts
import { UserService } from '../../service/user-service.js';

// Tự động kiểm tra trùng lặp trong DB và trả về 1 mã 6 ký tự mới (VD: "3a8f1c"):
const uniqueUserId = await UserService.getOrGenerateUserId();
```

---

## 3. Các File Đặc Biệt Ở Frontend Cần Chú Ý

### 3.1. `client/src/pages/_app.js` (Root Component & SSR Initializer)
Đây là "trái tim" của toàn bộ Frontend:
- Bọc ngoài tất cả các trang, nạp CSS Bootstrap.
- Chứa phương thức **`AppComponent.getInitialProps`**: Phương thức này chạy **Server-Side** (trên máy chủ Node.js của Client Pod) trước khi trang được render.
- Tại đây, nó gọi `GET /api/users/currentuser` để xác định người dùng đã đăng nhập hay chưa, sau đó tiêm thuộc tính `currentUser` vào `Header` và tất cả các component trang con.

---

### 3.2. `client/src/api/build-client.js` (Cầu Nối API SSR vs Browser)
Tại sao không dùng trực tiếp `axios.get('/api/...')` trên SSR?
- **Khi chạy trên Trình duyệt (Browser)**: `typeof window !== 'undefined'`, trình duyệt tự động gửi kèm Cookie phiên của người dùng và biết domain hiện tại là `https://glassic.dev`.
- **Khi chạy trên Server (SSR trong Pod Kubernetes)**: Ứng dụng Next.js đang chạy độc lập trong container, nó **không biết domain `glassic.dev` là ai**, và cũng **không tự có cookie của trình duyệt**.
- **Giải pháp của `buildClient`**:
  ```js
  // Nếu là SSR (Server side):
  baseURL: 'http://ingress-nginx-controller.ingress-nginx.svc.cluster.local'
  headers: {
    ...req.headers, // Chuyển tiếp cookie của trình duyệt người dùng vào Pod Server
    Host: 'glassic.dev' // Giúp Ingress nhận diện đúng rule routing
  }
  ```
👉 **Cách dùng khi viết trang có `getInitialProps`**:
```js
import buildClient from '../api/build-client';

const MyPage = ({ data }) => {
  return <div>{data}</div>;
};

MyPage.getInitialProps = async (context) => {
  const client = buildClient(context);
  const { data } = await client.get('/api/users/some-endpoint');
  return { data };
};
```

---

### 3.3. `client/src/hooks/use-request.js` (Custom Hook Gọi API Client-side)
Dùng cho tất cả các thao tác tương tác của người dùng trên giao diện (bấm nút, nộp form, xóa, sửa):
- Tự động quản lý cờ trạng thái `loading` (đang gửi request).
- Tự động bắt lỗi từ backend và biên dịch thành khối thông báo HTML đẹp mắt (`errors`).

👉 **Cách sử dụng**:
```jsx
import useRequest from '../../hooks/use-request';

const MyComponent = () => {
  const [name, setName] = useState('');

  const { doRequest, errors, loading } = useRequest({
    url: '/api/users/classes',
    method: 'post',
    body: { name },
    onSuccess: (responseData) => {
      console.log('Thành công:', responseData);
      // Reset form hoặc điều hướng...
    }
  });

  const onSubmit = async (e) => {
    e.preventDefault();
    await doRequest();
  };

  return (
    <form onSubmit={onSubmit}>
      <input value={name} onChange={(e) => setName(e.target.value)} />
      {errors}
      <button disabled={loading}>
        {loading ? 'Đang lưu...' : 'Tạo mới'}
      </button>
    </form>
  );
};
```

---

### 3.4. `AdminDashboard.js` & `AdminSidebar.js` (Mô Hình Điều Khiển Module)
Hệ thống Admin Dashboard không nhồi toàn bộ code vào 1 trang duy nhất, mà chia nhỏ thành các Component View độc lập:
1. `AdminSidebar.js`: Định nghĩa danh sách các mục quản trị (`menuItems`):
   ```js
   const menuItems = [
     { id: 'classes', label: 'Lớp học' },
     { id: 'teachers', label: 'Giáo viên' },
     { id: 'students', label: 'Học sinh' },
     { id: 'overview', label: 'Tổng quan' },
     // Thêm mục mới tại đây...
   ];
   ```
2. `AdminDashboard.js`: Đồng bộ tab qua URL `/?tab=<id>` và mount View tương ứng trong hàm `renderActiveView()`:
   ```jsx
   const renderActiveView = () => {
     switch (activeTab) {
       case 'classes': return <ClassManagementView />;
       case 'teachers': return <TeacherManagementView />;
       case 'students': return <StudentManagementView />;
       case 'overview': return <OverviewView />;
     }
   };
   ```

---

## 4. Lưu Ý Sống Còn Về Ingress Controller Khi Thêm API

Hãy mở file cấu hình định tuyến Kubernetes: `infra/k8s/ingress-srv.yaml`:

```yaml
rules:
  - host: glassic.dev
    http:
      paths:
        - path: /api/users/?(.*)       # <--- ĐIỀU NÀY RẤT QUAN TRỌNG
          pathType: ImplementationSpecific
          backend:
            service:
              name: server-srv
              port:
                number: 3000
        - path: /?(.*)                 # <--- MỌI REQUEST CÒN LẠI ĐỀU GỬI CHO CLIENT
          pathType: ImplementationSpecific
          backend:
            service:
              name: client-srv
              port:
                number: 3000
```

> ⚠️ **Quy tắc định tuyến**:
> Hiện tại, Ingress chỉ chuyển hướng những request có đường dẫn bắt đầu bằng **/api/users/...** về Backend (`server-srv`).
> 
> **Do đó, có 2 cách khi tạo API mới:**
> 1. **Cách nhanh nhất (Khuyên dùng)**: Luôn đặt tiền tố API mới bắt đầu bằng `/api/users/...`
>    - Ví dụ: `/api/users/classes`, `/api/users/teachers`, `/api/users/subjects`.
>    - Lúc này bạn **không cần sửa hay redeploy file Ingress k8s**.
> 2. **Cách mở rộng Ingress**: Nếu bạn muốn đặt đường dẫn ngắn hơn như `/api/classes` hay `/api/subjects`, bạn **bắt buộc** phải khai báo thêm path tương ứng trong `infra/k8s/ingress-srv.yaml` (phía trên `client-srv`), sau đó chạy `kubectl apply -f infra/k8s/ingress-srv.yaml`.

---

## 5. Quy Trình Mẫu: Thêm Một Nghiệp Vụ Mới Từ A Đến Z

Giả sử bạn cần xây dựng tính năng **Quản lý Môn học (Subject Management)**:

### Bước 1: Khai báo Model trong Database
1. Mở `server/prisma/schema.prisma` và thêm model:
   ```prisma
   model Subject {
     subjectId   String @id
     subjectName String
     credits     Int    @default(2)
   }
   ```
2. Chạy migration tạo bảng trong PostgreSQL:
   ```bash
   cd server
   npx prisma migrate dev --name add_subject_table
   npx prisma generate
   ```

### Bước 2: Tạo API ở Backend
1. Tạo thư mục và file mới: `server/src/routes/subject-management/index.ts`:
   ```ts
   import express from 'express';
   import type { Request, Response } from 'express';
   import { prisma } from '../../service/prisma.js';
   import { requireAdmin } from '../../middlewares/require-admin.js';
   import { BadRequestError } from '@xen-tickets/common';

   const router = express.Router();

   // GET: Lấy danh sách môn học
   router.get('/api/users/subjects', requireAdmin, async (req: Request, res: Response) => {
       const subjects = await prisma.subject.findMany({ orderBy: { subjectId: 'asc' } });
       res.send(subjects);
   });

   // POST: Thêm môn học mới
   router.post('/api/users/subjects', requireAdmin, async (req: Request, res: Response) => {
       const { subjectId, subjectName, credits } = req.body;
       if (!subjectId || !subjectName) {
           throw new BadRequestError('Mã môn học và tên môn học không được để trống');
       }
       const newSubject = await prisma.subject.create({
           data: { subjectId, subjectName, credits: Number(credits) || 2 }
       });
       res.status(201).send(newSubject);
   });

   export { router as subjectManagementRouter };
   ```

2. Đăng ký router trong `server/src/index.ts`:
   ```ts
   import { subjectManagementRouter } from './routes/subject-management/index.js';
   // ...
   app.use(subjectManagementRouter);
   ```

### Bước 3: Tạo Giao diện Quản lý ở Frontend
1. Tạo component giao diện mới: `client/src/components/admin/SubjectManagementView.js`.
   *(Sử dụng `axios.get('/api/users/subjects')` để lấy danh sách và `useRequest` khi tạo form mới).*
2. Thêm vào menu `client/src/components/admin/AdminSidebar.js`:
   ```js
   { id: 'subjects', label: 'Môn học' }
   ```
3. Nạp vào khung điều khiển `client/src/components/admin/AdminDashboard.js`:
   ```jsx
   import SubjectManagementView from './SubjectManagementView';
   // ...
   case 'subjects':
     return <SubjectManagementView />;
   ```

Đến đây, bạn chỉ cần mở trình duyệt tại `https://glassic.dev/?tab=subjects` là tính năng mới đã hoàn chỉnh và hoạt động trơn tru từ Frontend đến Database!

