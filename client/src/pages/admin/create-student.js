import { useState } from 'react';
import Router from 'next/router';
import Link from 'next/link';
import useRequest from '../../hooks/use-request';

export default ({ currentUser }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    studentId: '',
    studentName: '',
    email: '',
    phoneNumber: '',
    dateOfBirth: '',
    gender: 'Nam',
    address: ''
  });

  const [createdStudent, setCreatedStudent] = useState(null);

  const { doRequest, errors, loading } = useRequest({
    url: '/api/users/createStudent',
    method: 'post',
    body: formData,
    onSuccess: (data) => {
      setCreatedStudent(data);
    }
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    await doRequest();
  };

  if (currentUser && currentUser.role !== 'ADMIN') {
    return (
      <div className="container py-5 text-center">
        <div className="alert alert-danger p-4 rounded-1 border">
          <h5 className="fw-bold mb-1">Truy cập bị từ chối</h5>
          <p className="mb-2">Trang này chỉ dành riêng cho Quản trị viên (Admin).</p>
          <Link href="/" className="btn btn-outline-dark btn-sm rounded-1">
            Quay lại Trang Chủ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-12 col-lg-8">
          <div className="card border rounded-1 bg-white">
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center pb-3 mb-4 border-bottom">
                <div>
                  <h5 className="fw-bold text-dark mb-0">Tạo Hồ Sơ Học Sinh</h5>
                  <small className="text-secondary">
                    Cấp mã học sinh và tài khoản định danh mới vào hệ thống
                  </small>
                </div>
                <Link href="/?tab=students" className="btn btn-outline-secondary btn-sm rounded-1">
                  Quay lại danh sách
                </Link>
              </div>

              {createdStudent && (
                <div className="alert alert-success rounded-1 border p-3 mb-4">
                  <div className="fw-bold mb-2">Đã tạo học sinh thành công</div>
                  <div className="small mb-1">
                    <strong>Họ tên:</strong> {createdStudent.student?.studentName}
                  </div>
                  <div className="small mb-1">
                    <strong>Mã Học sinh:</strong> <code className="text-dark bg-white px-1 border rounded-1">{createdStudent.student?.studentId}</code>
                  </div>
                  <div className="small mb-1">
                    <strong>Mã UserID:</strong> <code className="text-dark bg-white px-1 border rounded-1">{createdStudent.userId}</code>
                  </div>
                  <div className="small text-secondary mb-3 mt-2">
                    Học sinh có thể sử dụng Mã Học sinh ({createdStudent.student?.studentId}) hoặc UserID và mật khẩu vừa cấp để đăng nhập.
                  </div>
                  <button
                    onClick={() => {
                      setCreatedStudent(null);
                      setFormData({
                        username: '',
                        password: '',
                        studentId: '',
                        studentName: '',
                        email: '',
                        phoneNumber: '',
                        dateOfBirth: '',
                        gender: 'Nam',
                        address: ''
                      });
                    }}
                    className="btn btn-dark btn-sm rounded-1"
                  >
                    + Tạo thêm học sinh khác
                  </button>
                </div>
              )}

              <form onSubmit={onSubmit}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold text-secondary mb-1">
                      Mã Học sinh (studentId) *
                    </label>
                    <input
                      name="studentId"
                      value={formData.studentId}
                      onChange={handleChange}
                      className="form-control form-control-sm rounded-1"
                      placeholder="VD: HS001"
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label small fw-semibold text-secondary mb-1">
                      Họ và Tên *
                    </label>
                    <input
                      name="studentName"
                      value={formData.studentName}
                      onChange={handleChange}
                      className="form-control form-control-sm rounded-1"
                      placeholder="VD: Nguyễn Văn An"
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label small fw-semibold text-secondary mb-1">
                      Tên đăng nhập (Username) *
                    </label>
                    <input
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      className="form-control form-control-sm rounded-1"
                      placeholder="VD: hs_nguyenvanan"
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label small fw-semibold text-secondary mb-1">
                      Mật khẩu khởi tạo *
                    </label>
                    <input
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="form-control form-control-sm rounded-1"
                      placeholder="Tối thiểu 6 ký tự"
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label small fw-semibold text-secondary mb-1">
                      Email liên hệ *
                    </label>
                    <input
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="form-control form-control-sm rounded-1"
                      placeholder="an.nv@student.glassic.edu.vn"
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label small fw-semibold text-secondary mb-1">
                      Số điện thoại *
                    </label>
                    <input
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      className="form-control form-control-sm rounded-1"
                      placeholder="0987654321"
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label small fw-semibold text-secondary mb-1">
                      Ngày sinh *
                    </label>
                    <input
                      name="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={handleChange}
                      className="form-control form-control-sm rounded-1"
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label small fw-semibold text-secondary mb-1">
                      Giới tính *
                    </label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className="form-select form-select-sm rounded-1"
                    >
                      <option value="Nam">Nam</option>
                      <option value="Nữ">Nữ</option>
                      <option value="Khác">Khác</option>
                    </select>
                  </div>

                  <div className="col-12">
                    <label className="form-label small fw-semibold text-secondary mb-1">
                      Địa chỉ cư trú *
                    </label>
                    <input
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      className="form-control form-control-sm rounded-1"
                      placeholder="Địa chỉ cư trú..."
                      required
                    />
                  </div>
                </div>

                {errors}

                <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
                  <Link href="/?tab=students" className="btn btn-outline-secondary btn-sm rounded-1 px-3">
                    Hủy
                  </Link>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-dark btn-sm rounded-1 px-4 fw-semibold"
                  >
                    {loading ? 'Đang khởi tạo...' : 'Lưu Hồ Sơ Học Sinh'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
