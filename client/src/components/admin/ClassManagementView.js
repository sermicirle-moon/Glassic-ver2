import React, { useState, useEffect } from 'react';
import axios from 'axios';
import useRequest from '../../hooks/use-request';
import ClassStudentsPanel from '../common/ClassStudentsPanel';

const emptyForm = {
  classId: '',
  className: '',
  grade: 'Khối 10',
  maxStudents: 40,
  homeroomTeacherId: '',
  status: 'Hoạt động'
};

// Form thêm / sửa lớp học. Tách riêng để mỗi lần mở là một form mới (không dính lỗi cũ).
const ClassForm = ({ editingClass, teachers, onCancel, onSaved }) => {
  const isEditing = Boolean(editingClass);

  const [formData, setFormData] = useState(
    isEditing
      ? {
          classId: editingClass.classId,
          className: editingClass.className,
          grade: editingClass.grade,
          maxStudents: editingClass.maxStudents,
          homeroomTeacherId: editingClass.homeroomTeacherId || '',
          status: editingClass.status
        }
      : emptyForm
  );

  const { doRequest, errors, loading } = useRequest({
    url: isEditing ? `/api/users/classes/${editingClass.classId}` : '/api/users/classes',
    method: isEditing ? 'put' : 'post',
    body: formData,
    onSuccess: onSaved
  });

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await doRequest();
  };

  return (
    <div className="card border rounded-1 p-3 bg-white">
      <div className="fw-semibold small text-dark mb-2">
        {isEditing ? `Cập Nhật Lớp ${editingClass.classId}` : 'Thêm Lớp Học Mới'}
      </div>
      <form onSubmit={handleSubmit}>
        <div className="row g-2">
          <div className="col-md-3">
            <label className="form-label small text-secondary mb-1">Mã lớp *</label>
            <input
              required
              name="classId"
              value={formData.classId}
              onChange={handleInputChange}
              disabled={isEditing}
              placeholder="VD: 10A3"
              className="form-control form-control-sm rounded-1"
            />
          </div>
          <div className="col-md-5">
            <label className="form-label small text-secondary mb-1">Tên lớp học *</label>
            <input
              required
              name="className"
              value={formData.className}
              onChange={handleInputChange}
              placeholder="VD: Lớp 10A3 - Chuyên Hóa"
              className="form-control form-control-sm rounded-1"
            />
          </div>
          <div className="col-md-2">
            <label className="form-label small text-secondary mb-1">Khối *</label>
            <select
              name="grade"
              value={formData.grade}
              onChange={handleInputChange}
              className="form-select form-select-sm rounded-1"
            >
              <option value="Khối 10">Khối 10</option>
              <option value="Khối 11">Khối 11</option>
              <option value="Khối 12">Khối 12</option>
            </select>
          </div>
          <div className="col-md-2">
            <label className="form-label small text-secondary mb-1">Sĩ số tối đa *</label>
            <input
              required
              type="number"
              min="1"
              max="100"
              name="maxStudents"
              value={formData.maxStudents}
              onChange={handleInputChange}
              className="form-control form-control-sm rounded-1"
            />
          </div>

          <div className="col-md-6">
            <label className="form-label small text-secondary mb-1">Giáo viên chủ nhiệm</label>
            <select
              name="homeroomTeacherId"
              value={formData.homeroomTeacherId}
              onChange={handleInputChange}
              className="form-select form-select-sm rounded-1"
            >
              <option value="">Chưa gán</option>
              {teachers.map((t) => (
                <option key={t.teacherId} value={t.teacherId}>
                  {t.teacherName} ({t.teacherId})
                </option>
              ))}
            </select>
          </div>
          {isEditing && (
            <div className="col-md-3">
              <label className="form-label small text-secondary mb-1">Trạng thái</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="form-select form-select-sm rounded-1"
              >
                <option value="Hoạt động">Hoạt động</option>
                <option value="Tạm ngưng">Tạm ngưng</option>
              </select>
            </div>
          )}
        </div>

        {errors}

        <div className="d-flex justify-content-end gap-2 mt-3">
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-outline-secondary btn-sm rounded-1 px-3"
          >
            Hủy
          </button>
          <button type="submit" disabled={loading} className="btn btn-dark btn-sm rounded-1 px-3">
            {loading ? 'Đang lưu...' : isEditing ? 'Cập nhật lớp học' : 'Lưu lớp học'}
          </button>
        </div>
      </form>
    </div>
  );
};

const ClassManagementView = () => {
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterGrade, setFilterGrade] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [actionError, setActionError] = useState('');

  const fetchClasses = async () => {
    try {
      const { data } = await axios.get('/api/users/classes');
      setClasses(data);
    } catch (err) {
      console.error('Lỗi tải danh sách lớp học:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const { data } = await axios.get('/api/users/teachers');
      setTeachers(data);
    } catch (err) {
      console.error('Lỗi tải danh sách giáo viên:', err);
    }
  };

  useEffect(() => {
    fetchClasses();
    fetchTeachers();
  }, []);

  const openCreateForm = () => {
    setEditingClass(null);
    setShowForm(true);
  };

  const openEditForm = (c) => {
    setEditingClass(c);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingClass(null);
  };

  const handleSaved = () => {
    closeForm();
    fetchClasses();
  };

  const handleDelete = async (c) => {
    if (!window.confirm(`Xóa lớp ${c.classId} - ${c.className}?`)) return;
    try {
      setActionError('');
      await axios.delete(`/api/users/classes/${c.classId}`);
      if (selectedClassId === c.classId) setSelectedClassId(null);
      fetchClasses();
    } catch (err) {
      setActionError(
        err.response?.data?.errors?.[0]?.message || 'Có lỗi xảy ra, vui lòng thử lại sau.'
      );
    }
  };

  const filteredClasses = classes.filter((c) => {
    const term = searchTerm.toLowerCase();
    const matchGrade = filterGrade === 'ALL' || c.grade === filterGrade;
    const matchSearch =
      c.className.toLowerCase().includes(term) ||
      c.classId.toLowerCase().includes(term) ||
      (c.homeroomTeacher?.teacherName || '').toLowerCase().includes(term);
    return matchGrade && matchSearch;
  });

  const selectedClass = classes.find((c) => c.classId === selectedClassId) || null;

  return (
    <div className="d-flex flex-column gap-3">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center pb-2 border-bottom">
        <div>
          <h5 className="fw-bold text-dark mb-0">Quản Lý Lớp Học</h5>
          <small className="text-secondary">Danh sách các lớp học và phân công giáo viên chủ nhiệm</small>
        </div>
        <div className="d-flex gap-2">
          <button
            onClick={fetchClasses}
            className="btn btn-outline-secondary btn-sm rounded-1 px-3"
          >
            Làm mới
          </button>
          <button
            onClick={showForm ? closeForm : openCreateForm}
            className="btn btn-dark btn-sm rounded-1 px-3"
          >
            {showForm ? 'Đóng' : '+ Thêm lớp học'}
          </button>
        </div>
      </div>

      {/* Form thêm / sửa */}
      {showForm && (
        <ClassForm
          key={editingClass ? editingClass.classId : 'new'}
          editingClass={editingClass}
          teachers={teachers}
          onCancel={closeForm}
          onSaved={handleSaved}
        />
      )}

      {actionError && (
        <div className="alert alert-danger rounded-1 border small mb-0" role="alert">
          {actionError}
        </div>
      )}

      {/* Filter and Search */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2">
        <div style={{ maxWidth: '320px', width: '100%' }}>
          <input
            type="text"
            className="form-control form-control-sm rounded-1"
            placeholder="Tìm theo tên lớp, mã lớp, GVCN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="d-flex gap-1">
          {['ALL', 'Khối 10', 'Khối 11', 'Khối 12'].map((grade) => (
            <button
              key={grade}
              onClick={() => setFilterGrade(grade)}
              className={`btn btn-sm rounded-1 ${
                filterGrade === grade ? 'btn-dark' : 'btn-outline-secondary'
              }`}
              style={{ fontSize: '13px' }}
            >
              {grade === 'ALL' ? 'Tất cả' : grade}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card border rounded-1 overflow-hidden bg-white">
        <table className="table table-sm table-hover align-middle mb-0" style={{ fontSize: '13.5px' }}>
          <thead className="table-light">
            <tr className="text-secondary" style={{ fontSize: '12px' }}>
              <th className="py-2 ps-3">MÃ LỚP</th>
              <th className="py-2">TÊN LỚP</th>
              <th className="py-2">KHỐI</th>
              <th className="py-2">GV CHỦ NHIỆM</th>
              <th className="py-2">SĨ SỐ</th>
              <th className="py-2">TRẠNG THÁI</th>
              <th className="py-2 text-end pe-3">THAO TÁC</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="text-center py-4 text-muted">
                  Đang tải danh sách...
                </td>
              </tr>
            ) : filteredClasses.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center py-4 text-muted">
                  {classes.length === 0 ? 'Chưa có lớp học nào.' : 'Không tìm thấy lớp học nào.'}
                </td>
              </tr>
            ) : (
              filteredClasses.map((c) => (
                <tr key={c.classId}>
                  <td className="ps-3 fw-semibold text-dark font-monospace">{c.classId}</td>
                  <td>{c.className}</td>
                  <td>
                    <span className="badge text-bg-light border rounded-1 fw-normal text-secondary">
                      {c.grade}
                    </span>
                  </td>
                  <td>
                    {c.homeroomTeacher ? (
                      `${c.homeroomTeacher.teacherName} (${c.homeroomTeacher.teacherId})`
                    ) : (
                      <span className="text-muted">Chưa gán</span>
                    )}
                  </td>
                  <td>
                    {c.totalStudents} / {c.maxStudents}
                  </td>
                  <td>
                    <span
                      className={`small fw-semibold ${
                        c.status === 'Hoạt động' ? 'text-success' : 'text-secondary'
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="text-end pe-3">
                    <div className="d-flex justify-content-end gap-1">
                      <button
                        onClick={() => setSelectedClassId(c.classId)}
                        className="btn btn-outline-secondary btn-sm rounded-1 py-0 px-2"
                        style={{ fontSize: '12px' }}
                      >
                        Chi tiết
                      </button>
                      <button
                        onClick={() => openEditForm(c)}
                        className="btn btn-outline-secondary btn-sm rounded-1 py-0 px-2"
                        style={{ fontSize: '12px' }}
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => handleDelete(c)}
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

      {/* Chi tiết lớp: danh sách và xếp học sinh */}
      {selectedClass && (
        <ClassStudentsPanel
          key={selectedClass.classId}
          classInfo={selectedClass}
          canManage={true}
          onClose={() => setSelectedClassId(null)}
          onChanged={fetchClasses}
        />
      )}
    </div>
  );
};

export default ClassManagementView;