import React, { useState } from 'react';

const initialClasses = [
  { id: '10A1', name: 'Lớp 10A1 - Toán Tin', grade: 'Khối 10', homeroomTeacher: 'Trần Thị Mai (GV001)', totalStudents: 38, maxStudents: 40, status: 'Hoạt động' },
  { id: '10A2', name: 'Lớp 10A2 - Khoa học Tự nhiên', grade: 'Khối 10', homeroomTeacher: 'Nguyễn Văn Nam (GV002)', totalStudents: 36, maxStudents: 40, status: 'Hoạt động' },
  { id: '11A1', name: 'Lớp 11A1 - Toán Lý', grade: 'Khối 11', homeroomTeacher: 'Lê Thu Hà (GV003)', totalStudents: 40, maxStudents: 40, status: 'Hoạt động' },
  { id: '11B1', name: 'Lớp 11B1 - Xã hội Nhân văn', grade: 'Khối 11', homeroomTeacher: 'Phạm Đức Minh (GV004)', totalStudents: 35, maxStudents: 40, status: 'Hoạt động' },
  { id: '12A1', name: 'Lớp 12A1 - Ôn thi THPT', grade: 'Khối 12', homeroomTeacher: 'Hoàng Thị Yến (GV005)', totalStudents: 39, maxStudents: 40, status: 'Hoạt động' },
  { id: '12A2', name: 'Lớp 12A2 - Tiếng Anh', grade: 'Khối 12', homeroomTeacher: 'Vũ Quốc Bảo (GV006)', totalStudents: 32, maxStudents: 40, status: 'Hoạt động' },
];

const ClassManagementView = () => {
  const [classes, setClasses] = useState(initialClasses);
  const [filterGrade, setFilterGrade] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const [newClass, setNewClass] = useState({
    id: '',
    name: '',
    grade: 'Khối 10',
    homeroomTeacher: '',
    maxStudents: 40
  });

  const handleAddClass = (e) => {
    e.preventDefault();
    if (!newClass.id || !newClass.name) return;

    setClasses([
      { ...newClass, totalStudents: 0, status: 'Hoạt động' },
      ...classes
    ]);

    setNewClass({
      id: '',
      name: '',
      grade: 'Khối 10',
      homeroomTeacher: '',
      maxStudents: 40
    });
    setShowAddForm(false);
  };

  const filteredClasses = classes.filter((c) => {
    const matchGrade = filterGrade === 'ALL' || c.grade === filterGrade;
    const matchSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.homeroomTeacher.toLowerCase().includes(searchTerm.toLowerCase());
    return matchGrade && matchSearch;
  });

  return (
    <div className="d-flex flex-column gap-3">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center pb-2 border-bottom">
        <div>
          <h5 className="fw-bold text-dark mb-0">Quản Lý Lớp Học</h5>
          <small className="text-secondary">Danh sách các lớp học và phân công giáo viên chủ nhiệm</small>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn btn-dark btn-sm rounded-1 px-3"
        >
          {showAddForm ? 'Đóng' : '+ Thêm lớp học'}
        </button>
      </div>

      {/* Form thêm mới */}
      {showAddForm && (
        <div className="card border rounded-1 p-3 bg-white">
          <div className="fw-semibold small text-dark mb-2">Thêm Lớp Học Mới</div>
          <form onSubmit={handleAddClass}>
            <div className="row g-2">
              <div className="col-md-3">
                <label className="form-label small text-secondary mb-1">Mã lớp</label>
                <input
                  required
                  placeholder="VD: 10A3"
                  className="form-control form-control-sm rounded-1"
                  value={newClass.id}
                  onChange={(e) => setNewClass({ ...newClass, id: e.target.value })}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label small text-secondary mb-1">Tên lớp học</label>
                <input
                  required
                  placeholder="VD: Lớp 10A3 - Chuyên Hóa"
                  className="form-control form-control-sm rounded-1"
                  value={newClass.name}
                  onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
                />
              </div>
              <div className="col-md-2">
                <label className="form-label small text-secondary mb-1">Khối</label>
                <select
                  className="form-select form-select-sm rounded-1"
                  value={newClass.grade}
                  onChange={(e) => setNewClass({ ...newClass, grade: e.target.value })}
                >
                  <option value="Khối 10">Khối 10</option>
                  <option value="Khối 11">Khối 11</option>
                  <option value="Khối 12">Khối 12</option>
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label small text-secondary mb-1">Giáo viên chủ nhiệm</label>
                <input
                  placeholder="Họ tên GV (Mã GV)"
                  className="form-control form-control-sm rounded-1"
                  value={newClass.homeroomTeacher}
                  onChange={(e) => setNewClass({ ...newClass, homeroomTeacher: e.target.value })}
                />
              </div>
            </div>
            <div className="d-flex justify-content-end gap-2 mt-3">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="btn btn-outline-secondary btn-sm rounded-1 px-3"
              >
                Hủy
              </button>
              <button type="submit" className="btn btn-dark btn-sm rounded-1 px-3">
                Lưu lớp học
              </button>
            </div>
          </form>
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
            {filteredClasses.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center py-4 text-muted">
                  Không tìm thấy lớp học nào.
                </td>
              </tr>
            ) : (
              filteredClasses.map((c) => (
                <tr key={c.id}>
                  <td className="ps-3 fw-semibold text-dark font-monospace">{c.id}</td>
                  <td>{c.name}</td>
                  <td>
                    <span className="badge text-bg-light border rounded-1 fw-normal text-secondary">
                      {c.grade}
                    </span>
                  </td>
                  <td>{c.homeroomTeacher || <span className="text-muted">Chưa gán</span>}</td>
                  <td>{c.totalStudents} / {c.maxStudents}</td>
                  <td>
                    <span className="text-success small fw-semibold">
                      {c.status}
                    </span>
                  </td>
                  <td className="text-end pe-3">
                    <button className="btn btn-outline-secondary btn-sm rounded-1 py-0 px-2" style={{ fontSize: '12px' }}>
                      Chi tiết
                    </button>
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

export default ClassManagementView;
