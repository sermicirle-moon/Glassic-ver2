import React, { useState } from 'react';
import axios from 'axios';

const StudentProfileView = ({ student, onProfileUpdated }) => {
  const [formData, setFormData] = useState({
    phoneNumber: student?.phoneNumber || '',
    email: student?.email || '',
    address: student?.address || ''
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await axios.put('/api/users/students/me', formData);
      setMessage({ type: 'success', text: 'Cập nhật thông tin liên hệ thành công!' });
      if (onProfileUpdated) {
        onProfileUpdated(res.data);
      }
    } catch (err) {
      const errMsg = err.response?.data?.errors?.[0]?.message || 'Có lỗi xảy ra khi cập nhật.';
      setMessage({ type: 'danger', text: errMsg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex flex-column gap-3">
      {/* Header Profile */}
      <div className="card border rounded-1 p-3 bg-white">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2">
          <div>
            <h5 className="fw-bold text-dark mb-1">Hồ Sơ Học Sinh</h5>
            <small className="text-secondary">
              Quản lý thông tin định danh cá nhân và phương thức liên lạc
            </small>
          </div>
          <span className="badge text-bg-light border text-secondary rounded-1 px-2 py-1">
            Mã định danh: {student?.studentId}
          </span>
        </div>
      </div>

      {message && (
        <div className={`alert alert-${message.type} border rounded-1 py-2 px-3 small mb-0`} role="alert">
          {message.text}
        </div>
      )}

      <div className="row g-3">
        {/* Cột trái: Thông tin học sinh cố định */}
        <div className="col-12 col-md-5">
          <div className="card border rounded-1 p-3 bg-white h-100">
            <h6 className="fw-bold text-dark mb-3 border-bottom pb-2" style={{ fontSize: '13.5px' }}>
              Thông Tin Định Danh
            </h6>

            <div className="d-flex flex-column gap-3 small">
              <div>
                <label className="text-secondary fw-semibold d-block" style={{ fontSize: '11px' }}>
                  HỌ VÀ TÊN
                </label>
                <div className="fw-bold text-dark fs-6">{student?.studentName}</div>
              </div>

              <div>
                <label className="text-secondary fw-semibold d-block" style={{ fontSize: '11px' }}>
                  MÃ HỌC SINH (STUDENT ID)
                </label>
                <div>
                  <code className="text-dark bg-light px-1 border rounded-1">{student?.studentId}</code>
                </div>
              </div>

              <div>
                <label className="text-secondary fw-semibold d-block" style={{ fontSize: '11px' }}>
                  TÊN ĐĂNG NHẬP (USERNAME)
                </label>
                <div className="text-dark">{student?.username}</div>
              </div>

              <div className="row">
                <div className="col-6">
                  <label className="text-secondary fw-semibold d-block" style={{ fontSize: '11px' }}>
                    NGÀY SINH
                  </label>
                  <div className="text-dark">{student?.dateOfBirth}</div>
                </div>
                <div className="col-6">
                  <label className="text-secondary fw-semibold d-block" style={{ fontSize: '11px' }}>
                    GIỚI TÍNH
                  </label>
                  <div className="text-dark">{student?.gender}</div>
                </div>
              </div>

              <div className="mt-2 p-2 bg-light border rounded-1 text-secondary" style={{ fontSize: '11.5px' }}>
                ℹ️ Để điều chỉnh các thông tin định danh như Họ tên, Mã học sinh hay Ngày sinh, vui lòng liên hệ với phòng Đào tạo của nhà trường.
              </div>
            </div>
          </div>
        </div>

        {/* Cột phải: Cập nhật thông tin liên hệ */}
        <div className="col-12 col-md-7">
          <div className="card border rounded-1 p-3 bg-white h-100">
            <h6 className="fw-bold text-dark mb-3 border-bottom pb-2" style={{ fontSize: '13.5px' }}>
              Thông Tin Liên Lạc (Có Thể Cập Nhật)
            </h6>

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label small fw-semibold text-secondary" style={{ fontSize: '12px' }}>
                  Địa chỉ Email
                </label>
                <input
                  type="email"
                  className="form-control form-control-sm rounded-1"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Nhập địa chỉ email..."
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label small fw-semibold text-secondary" style={{ fontSize: '12px' }}>
                  Số điện thoại cá nhân
                </label>
                <input
                  type="text"
                  className="form-control form-control-sm rounded-1"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  placeholder="Nhập số điện thoại..."
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label small fw-semibold text-secondary" style={{ fontSize: '12px' }}>
                  Địa chỉ thường trú / liên lạc
                </label>
                <textarea
                  className="form-control form-control-sm rounded-1"
                  rows={3}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Nhập địa chỉ nhà..."
                  required
                />
              </div>

              <div className="d-flex justify-content-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-dark btn-sm rounded-1 px-4 py-2"
                  style={{ fontSize: '13px' }}
                >
                  {loading ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentProfileView;
