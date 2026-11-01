import Link from 'next/link';
import AdminDashboard from '../components/admin/AdminDashboard';

const LandingPage = ({ currentUser }) => {
  // 1. Trường hợp CHƯA ĐĂNG NHẬP
  if (!currentUser) {
    return (
      <div className="container py-5" style={{ maxWidth: '800px' }}>
        <div className="p-4 p-md-5 mb-4 bg-white border rounded-1 text-center">
          <h2 className="fw-bold text-dark mb-2">Hệ Thống Quản Lý Giáo Dục Glassic</h2>
          <p className="text-secondary small mb-4">
            Nền tảng quản trị phân hệ Lớp học, Giáo viên và Học sinh dành cho nhà trường.
          </p>
          <div className="d-flex justify-content-center gap-2">
            <Link href="/auth/signin" className="btn btn-dark btn-sm rounded-1 px-4 py-2">
              Đăng Nhập
            </Link>
            <Link href="/auth/signup" className="btn btn-outline-secondary btn-sm rounded-1 px-4 py-2">
              Đăng Ký Admin
            </Link>
          </div>
        </div>

        <div className="row g-3">
          <div className="col-md-4">
            <div className="card h-100 border rounded-1 p-3 bg-white">
              <div className="fw-bold text-dark small mb-1">Quản Trị Viên</div>
              <p className="text-secondary small mb-0">
                Toàn quyền phân lớp, quản lý nhân sự giáo viên và hồ sơ học sinh.
              </p>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card h-100 border rounded-1 p-3 bg-white">
              <div className="fw-bold text-dark small mb-1">Giáo Viên</div>
              <p className="text-secondary small mb-0">
                Theo dõi lớp phụ trách, quản lý học viên và sổ điểm điện tử.
              </p>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card h-100 border rounded-1 p-3 bg-white">
              <div className="fw-bold text-dark small mb-1">Học Sinh</div>
              <p className="text-secondary small mb-0">
                Tra cứu kết quả học tập, thời khóa biểu và thông báo của trường.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. MÀN HÌNH CHÍNH DÀNH CHO ADMIN
  if (currentUser.role === 'ADMIN') {
    return <AdminDashboard currentUser={currentUser} />;
  }

  // 3. MÀN HÌNH CHÍNH DÀNH CHO GIÁO VIÊN HOẶC HỌC SINH
  return (
    <div className="container py-5" style={{ maxWidth: '650px' }}>
      <div className="card border rounded-1 p-4 bg-white text-center">
        <div className="text-secondary small mb-1">Tài khoản cá nhân</div>
        <h4 className="fw-bold mb-1">{currentUser.username}</h4>
        <div className="small text-muted mb-3">
          Vai trò: <span className="fw-semibold text-dark">{currentUser.role}</span> | UserID: <code>{currentUser.userId}</code>
        </div>
        <div className="alert alert-light border rounded-1 small text-secondary mb-0">
          Tài khoản đã đăng nhập thành công vào hệ thống. Các tính năng chuyên biệt của phân hệ đang được đồng bộ.
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
