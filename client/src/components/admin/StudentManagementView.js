import React, { useState, useEffect } from 'react';
import axios from 'axios';
import useRequest from '../../hooks/use-request';

const StudentManagementView = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

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

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get('/api/users/students');
      setStudents(data);
    } catch (err) {
      console.error('Lỗi tải danh sách học sinh:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const { doRequest, errors, loading: submitting } = useRequest({
    url: '/api/users/createStudent',
    method: 'post',
    body: formData,
    onSuccess: () => {
      setShowAddForm(false);
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
      fetchStudents();
    }
  });

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await doRequest();
  };

  const filteredStudents = students.filter((s) => {
    const term = searchTerm.toLowerCase();
    return (
      s.studentName?.toLowerCase().includes(term) ||
      s.studentId?.toLowerCase().includes(term) ||
      s.email?.toLowerCase().includes(term) ||
      s.phoneNumber?.includes(term)
    );
  });

  const handleDeleteClick = async (studentId) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa học sinh ${studentId}?`)) {
      return;
    }
    try {
      await axios.delete(`/api/users/students/${studentId}`);
      alert('Đã xóa học sinh thành công!'); 
      fetchStudents();
    } catch (err) {
      alert('Lỗi khi xóa: ' + (err.response?.data?.errors?.[0]?.message || 'Lỗi hệ thống'));
      console.error('Lỗi chi tiết:', err);
    }
  }

  return (
    <div className="d-flex flex-column gap-3">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center pb-2 border-bottom">
        <div>
          <h5 className="fw-bold text-dark mb-0">Quản Lý Học Sinh</h5>
          <small className="text-secondary">Hồ sơ học sinh, phân lớp và tài khoản định danh</small>
        </div>
        <div className="d-flex gap-2">
          <button
            onClick={fetchStudents}
            className="btn btn-outline-secondary btn-sm rounded-1 px-3"
          >
            Làm mới
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="btn btn-dark btn-sm rounded-1 px-3"
          >
            {showAddForm ? 'Đóng' : '+ Thêm học sinh'}
          </button>
        </div>
      </div>

      {/* Form thêm mới học sinh */}
      {showAddForm && (
        <div className="card border rounded-1 p-3 bg-white">
          <div className="fw-semibold small text-dark mb-2">Thêm Hồ Sơ Học Sinh Mới</div>
          <form onSubmit={handleSubmit}>
            <div className="row g-2">
              <div className="col-md-3">
                <label className="form-label small text-secondary mb-1">Mã Học sinh (studentId) *</label>
                <input
                  required
                  name="studentId"
                  value={formData.studentId}
                  onChange={handleInputChange}
                  placeholder="VD: HS001"
                  className="form-control form-control-sm rounded-1"
                />
              </div>
              <div className="col-md-5">
                <label className="form-label small text-secondary mb-1">Họ và Tên *</label>
                <input
                  required
                  name="studentName"
                  value={formData.studentName}
                  onChange={handleInputChange}
                  placeholder="VD: Nguyễn Hoàng Nam"
                  className="form-control form-control-sm rounded-1"
                />
              </div>
              <div className="col-md-4">
                <label className="form-label small text-secondary mb-1">Tên đăng nhập (Username) *</label>
                <input
                  required
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="VD: hs_nguyenhoangnam"
                  className="form-control form-control-sm rounded-1"
                />
              </div>

              <div className="col-md-4">
                <label className="form-label small text-secondary mb-1">Mật khẩu ban đầu *</label>
                <input
                  required
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Tối thiểu 6 ký tự"
                  className="form-control form-control-sm rounded-1"
                />
              </div>
              <div className="col-md-4">
                <label className="form-label small text-secondary mb-1">Email học sinh *</label>
                <input
                  required
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="nam.nh@student.glassic.edu.vn"
                  className="form-control form-control-sm rounded-1"
                />
              </div>
              <div className="col-md-4">
                <label className="form-label small text-secondary mb-1">Số điện thoại *</label>
                <input
                  required
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  placeholder="0987654321"
                  className="form-control form-control-sm rounded-1"
                />
              </div>

              <div className="col-md-4">
                <label className="form-label small text-secondary mb-1">Ngày sinh *</label>
                <input
                  required
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                  className="form-control form-control-sm rounded-1"
                />
              </div>
              <div className="col-md-4">
                <label className="form-label small text-secondary mb-1">Giới tính *</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className="form-select form-select-sm rounded-1"
                >
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label small text-secondary mb-1">Địa chỉ *</label>
                <input
                  required
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Địa chỉ cư trú..."
                  className="form-control form-control-sm rounded-1"
                />
              </div>
            </div>

            {errors}

            <div className="d-flex justify-content-end gap-2 mt-3">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="btn btn-outline-secondary btn-sm rounded-1 px-3"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn btn-dark btn-sm rounded-1 px-3"
              >
                {submitting ? 'Đang lưu...' : 'Lưu học sinh'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search */}
      <div style={{ maxWidth: '360px', width: '100%' }}>
        <input
          type="text"
          className="form-control form-control-sm rounded-1"
          placeholder="Tìm theo mã HS, họ tên, email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="card border rounded-1 overflow-hidden bg-white">
        <table className="table table-sm table-hover align-middle mb-0" style={{ fontSize: '13.5px' }}>
          <thead className="table-light">
            <tr className="text-secondary" style={{ fontSize: '12px' }}>
              <th className="py-2 ps-3">MÃ HS</th>
              <th className="py-2">HỌ VÀ TÊN</th>
              <th className="py-2">EMAIL</th>
              <th className="py-2">SỐ ĐIỆN THOẠI</th>
              <th className="py-2">GIỚI TÍNH</th>
              <th className="py-2">NGÀY SINH</th>
              <th className="py-2">USERID</th>
              <th className="py-2 text-end pe-3">THAO TÁC</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" className="text-center py-4 text-muted">
                  Đang tải danh sách...
                </td>
              </tr>
            ) : filteredStudents.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center py-4 text-muted">
                  Chưa có dữ liệu học sinh.
                </td>
              </tr>
            ) : (
              filteredStudents.map((s) => (
                <tr key={s.studentId}>
                  <td className="ps-3 fw-semibold text-dark font-monospace">{s.studentId}</td>
                  <td className="fw-semibold text-dark">{s.studentName}</td>
                  <td className="text-secondary">{s.email}</td>
                  <td>{s.phoneNumber}</td>
                  <td>{s.gender}</td>
                  <td className="text-secondary">{s.dateOfBirth}</td>
                  <td>
                    <code className="text-dark bg-light px-1 border rounded-1 small">{s.userId}</code>
                  </td>
                  <td className="text-end pe-3">
                    <div className="d-flex gap-1 justify-content-end">
                      <button className="btn btn-outline-secondary btn-sm rounded-1 py-0 px-2" style={{ fontSize: '12px' }}>
                        Chi tiết
                      </button>
                      <button 
                        onClick={() => handleDeleteClick(s.studentId)}
                        className="btn btn-outline-danger btn-sm rounded-1 py-0 px-2" 
                        style={{ fontSize: '12px' }}
                      >
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StudentManagementView;
