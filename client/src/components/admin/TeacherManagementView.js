
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import useRequest from '../../hooks/use-request';

const TeacherManagementView = () => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTeacherId, setEditingTeacherId] = useState(null);

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    teacherId: '',
    teacherName: '',
    email: '',
    phoneNumber: '',
    dateOfBirth: '',
    gender: 'Nam',
    address: ''
  });

  const resetForm = () => {
    setFormData({
      username: '', password: '', teacherId: '', teacherName: '', 
      email: '', phoneNumber: '', dateOfBirth: '', gender: 'Nam', address: ''
    });
    setEditingTeacherId(null);
    setShowAddForm(false);
  };

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get('/api/users/teachers');
      setTeachers(data);
    } catch (err) {
      console.error('Lỗi tải danh sách giáo viên:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const { doRequest, errors, loading: submitting } = useRequest({
    url: '/api/users/createTeacher',
    method: 'post',
    body: formData,
    onSuccess: () => {
      resetForm();
      fetchTeachers();
    }
  });

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (editingTeacherId) {
      try {
        const updatePayload = {
          teacherName: formData.teacherName,
          email: formData.email,
          phoneNumber: formData.phoneNumber,
          gender: formData.gender,
          dateOfBirth: formData.dateOfBirth,
          address: formData.address
        };
        await axios.put(`/api/users/teachers/${editingTeacherId}`, updatePayload);
        alert('Cập nhật thông tin thành công!');
        resetForm();
        fetchTeachers();
      } catch (err) {
        alert('Lỗi cập nhật: ' + (err.response?.data?.errors?.[0]?.message || 'Lỗi hệ thống'));
      }
    } else {
      await doRequest();
    }
  };

  const handleEditClick = (teacher) => {
    setFormData({
      username: teacher.username || (teacher.user && teacher.user.username) || '',
      password: '',
      teacherId: teacher.teacherId,
      teacherName: teacher.teacherName || teacher.name || '',
      email: teacher.email || '',
      phoneNumber: teacher.phoneNumber || teacher.phone || '',
      dateOfBirth: teacher.dateOfBirth || teacher.dob || '',
      gender: teacher.gender || 'Nam',
      address: teacher.address || ''
    });
    setEditingTeacherId(teacher.teacherId);
    setShowAddForm(true);
  };

  const handleDeleteClick = async (teacherId) => {
    if (!window.confirm(`Xác nhận xóa tài khoản và hồ sơ của giáo viên mã [${teacherId}]? Hành động này không thể hoàn tác.`)) {
      return;
    }
    try {
      await axios.delete(`/api/users/teachers/${teacherId}`);
      alert('Đã xóa giáo viên thành công!');
      fetchTeachers();
    } catch (err) {
      alert('Lỗi khi xóa: ' + (err.response?.data?.errors?.[0]?.message || 'Lỗi hệ thống'));
    }
  };

  const filteredTeachers = teachers.filter((t) => {
    const term = searchTerm.toLowerCase();
    return (
      (t.teacherName || t.name)?.toLowerCase().includes(term) ||
      t.teacherId?.toLowerCase().includes(term) ||
      t.email?.toLowerCase().includes(term) ||
      (t.phoneNumber || t.phone)?.includes(term)
    );
  });
return (
    <div className="d-flex flex-column gap-3">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center pb-2 border-bottom">
        <div>
          <h5 className="fw-bold text-dark mb-0">Quản Lý Giáo Viên</h5>
          <small className="text-secondary">Danh sách nhân sự giảng dạy và tài khoản công vụ</small>
        </div>
        <div className="d-flex gap-2">
          <button
            onClick={fetchTeachers}
            className="btn btn-outline-secondary btn-sm rounded-1 px-3"
          >
            Làm mới
          </button>
          <button
            onClick={() => {
              if (showAddForm) resetForm(); 
              else setShowAddForm(true); 
            }}
            className="btn btn-dark btn-sm rounded-1 px-3"
          >
            {showAddForm ? 'Đóng form' : '+ Thêm giáo viên'}
          </button>
        </div>
      </div>

      {/* Form thêm mới / cập nhật giáo viên */}
      {showAddForm && (
        <div className="card border rounded-1 p-3 bg-white shadow-sm">
          <div className="fw-bold small text-dark mb-3">
            {editingTeacherId ? `Sửa Hồ Sơ Giáo Viên: ${editingTeacherId}` : 'Thêm Hồ Sơ Giáo Viên Mới'}
          </div>
          <form onSubmit={handleSubmit}>
            <div className="row g-2">
              <div className="col-md-3">
                <label className="form-label small text-secondary mb-1">Mã Giáo viên *</label>
                <input
                  required
                  name="teacherId"
                  value={formData.teacherId}
                  onChange={handleInputChange}
                  disabled={!!editingTeacherId} // KHÓA KHI ĐANG SỬA
                  placeholder="VD: GV001"
                  className="form-control form-control-sm rounded-1"
                />
              </div>
              <div className="col-md-5">
                <label className="form-label small text-secondary mb-1">Họ và Tên *</label>
                <input
                  required
                  name="teacherName"
                  value={formData.teacherName}
                  onChange={handleInputChange}
                  placeholder="VD: Trần Thị Mai"
                  className="form-control form-control-sm rounded-1"
                />
              </div>
              
              {/* Luôn hiển thị Username và Password */}
              <div className="col-md-4">
                <label className="form-label small text-secondary mb-1">Tên đăng nhập *</label>
                <input
                  required
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  disabled={!!editingTeacherId} // KHÓA KHI ĐANG SỬA
                  placeholder="VD: gv_tranthimai"
                  className="form-control form-control-sm rounded-1"
                />
              </div>
              {/* 👇 Ô Password CHỈ HIỂN THỊ KHI THÊM MỚI (Ẩn hoàn toàn khi Sửa) */}
              {!editingTeacherId && (
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
              )}
              

              <div className="col-md-4">
                <label className="form-label small text-secondary mb-1">Email công vụ *</label>
                <input
                  required
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="mai.tt@glassic.edu.vn"
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
                  placeholder="0912345678"
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

            {/* Hiển thị lỗi */}
            {errors}

            <div className="d-flex justify-content-end gap-2 mt-3">
              <button
                type="button"
                onClick={resetForm}
                className="btn btn-outline-secondary btn-sm rounded-1 px-3"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn btn-dark btn-sm rounded-1 px-3"
              >
                {submitting ? 'Đang xử lý...' : (editingTeacherId ? 'Cập nhật' : 'Lưu giáo viên')}
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
          placeholder="Tìm theo mã GV, họ tên, email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="card border rounded-1 overflow-hidden bg-white">
        <table className="table table-sm table-hover align-middle mb-0" style={{ fontSize: '13.5px' }}>
          <thead className="table-light">
            <tr className="text-secondary" style={{ fontSize: '12px' }}>
              <th className="py-2 ps-3">MÃ GV</th>
              <th className="py-2">HỌ VÀ TÊN</th>
              <th className="py-2">EMAIL</th>
              <th className="py-2">SỐ ĐIỆN THOẠI</th>
              <th className="py-2">GIỚI TÍNH</th>
              <th className="py-2">NGÀY SINH</th>
              <th className="py-2">USERID</th>
              <th className="py-2 text-center pe-3">THAO TÁC</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" className="text-center py-4 text-muted">
                  Đang tải danh sách...
                </td>
              </tr>
            ) : filteredTeachers.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center py-4 text-muted">
                  Chưa có dữ liệu giáo viên.
                </td>
              </tr>
            ) : (
              filteredTeachers.map((t) => (
                <tr key={t.teacherId}>
                  <td className="ps-3 fw-semibold text-dark font-monospace">{t.teacherId}</td>
                  <td className="fw-semibold text-dark">{t.teacherName || t.name}</td>
                  <td className="text-secondary">{t.email}</td>
                  <td>{t.phoneNumber || t.phone}</td>
                  <td>{t.gender}</td>
                  <td className="text-secondary">{t.dateOfBirth || t.dob}</td>
                  <td>
                    <code className="text-dark bg-light px-1 border rounded-1 small">{t.userId}</code>
                  </td>
                  <td className="text-end pe-3">
                    <div className="d-flex gap-1 justify-content-end">
                      <button className="btn btn-outline-secondary btn-sm rounded-1 py-0 px-2" style={{ fontSize: '12px' }}>
                        Chi tiết
                      </button>
                      <button 
                        onClick={() => handleEditClick(t)}
                        className="btn btn-outline-primary btn-sm rounded-1 py-0 px-2" 
                        style={{ fontSize: '12px' }}
                      >
                        Sửa
                      </button>
                      <button 
                        onClick={() => handleDeleteClick(t.teacherId)}
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

export default TeacherManagementView;