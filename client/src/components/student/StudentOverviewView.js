import React, { useState, useEffect } from 'react';
import axios from 'axios';

const formatTimeShort = (dStr) => {
  if (!dStr) return '';
  const d = new Date(dStr);
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
};

const formatDateShort = (dStr) => {
  if (!dStr) return '';
  const d = new Date(dStr);
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const StudentOverviewView = ({ student, activeClass, attendance = [], setActiveTab }) => {
  const [schedules, setSchedules] = useState([]);
  const [loadingSchedule, setLoadingSchedule] = useState(false);

  useEffect(() => {
    const fetchSchedules = async () => {
      if (!activeClass?.classId) return;
      setLoadingSchedule(true);
      try {
        const res = await axios.get('/api/users/schedules', {
          params: { classId: activeClass.classId }
        });
        setSchedules(res.data || []);
      } catch (err) {
        console.error('Lỗi lấy lịch học:', err);
      } finally {
        setLoadingSchedule(false);
      }
    };

    fetchSchedules();
  }, [activeClass?.classId]);

  // Tìm buổi học tiếp theo
  const now = new Date();
  const upcomingSchedules = schedules
    .filter((s) => new Date(s.endTime) >= now)
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  const nextLesson = upcomingSchedules[0] || null;

  // Lọc các buổi học hôm nay
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const todaySchedules = schedules.filter((s) => {
    const sDate = new Date(s.startTime);
    const key = `${sDate.getFullYear()}-${String(sDate.getMonth() + 1).padStart(2, '0')}-${String(sDate.getDate()).padStart(2, '0')}`;
    return key === todayStr;
  });

  // Tính thống kê điểm danh
  const totalAttendance = attendance.length;
  const presentCount = attendance.filter((a) => a.status === 'PRESENT').length;
  const excusedCount = attendance.filter((a) => a.status === 'EXCUSED').length;
  const absentCount = attendance.filter((a) => a.status === 'ABSENT').length;
  const attendanceRate = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 100;

  return (
    <div className="d-flex flex-column gap-3">
      {/* Thẻ chào mừng & Thông tin học sinh */}
      <div className="card border rounded-1 p-3 bg-white">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2">
          <div>
            <h5 className="fw-bold text-dark mb-1">
              Xin chào, {student?.studentName || student?.username} 👋
            </h5>
            <div className="small text-secondary">
              Mã học sinh: <strong>{student?.studentId}</strong> | Mã định danh UserID:{' '}
              <code className="text-dark bg-light px-1 border rounded-1">{student?.userId}</code>
            </div>
          </div>
          <div>
            <span className="badge text-bg-light border text-secondary rounded-1 fw-normal px-2 py-1">
              Vai trò: HỌC SINH
            </span>
          </div>
        </div>
      </div>

      {/* Lưới Thống kê 3 Thẻ */}
      <div className="row g-3">
        {/* Thẻ 1: Lớp học hiện tại */}
        <div className="col-12 col-md-4">
          <div className="card border rounded-1 p-3 bg-white h-100">
            <div
              className="text-secondary small fw-semibold text-uppercase"
              style={{ fontSize: '11px', letterSpacing: '0.5px' }}
            >
              Lớp Học Của Tôi
            </div>
            <div className="fs-3 fw-bold text-dark my-1">
              {activeClass ? activeClass.className : 'Chưa xếp'}
            </div>
            <div className="small text-secondary mb-2" style={{ fontSize: '12px' }}>
              {activeClass ? (
                <>
                  Khối: <strong>{activeClass.grade}</strong> | Sĩ số:{' '}
                  <strong>{activeClass.currentStudentsCount || 0} HS</strong>
                </>
              ) : (
                'Chưa được phân bổ lớp học'
              )}
            </div>
            <button
              onClick={() => setActiveTab('my-class')}
              className="btn btn-link p-0 text-dark small text-decoration-none mt-auto text-start"
              style={{ fontSize: '13px' }}
            >
              Xem chi tiết bạn học →
            </button>
          </div>
        </div>

        {/* Thẻ 2: Buổi học tiếp theo */}
        <div className="col-12 col-md-4">
          <div className="card border rounded-1 p-3 bg-white h-100">
            <div
              className="text-secondary small fw-semibold text-uppercase"
              style={{ fontSize: '11px', letterSpacing: '0.5px' }}
            >
              Buổi Học Kế Tiếp
            </div>
            {nextLesson ? (
              <>
                <div className="fw-bold text-dark my-1 text-truncate" style={{ fontSize: '17px' }}>
                  {nextLesson.lessonTopic || 'Tiết học trên lớp'}
                </div>
                <div className="small text-secondary mb-2" style={{ fontSize: '12px' }}>
                  🕒 {formatTimeShort(nextLesson.startTime)} - {formatTimeShort(nextLesson.endTime)} (
                  {formatDateShort(nextLesson.startTime)}) | Phòng: <strong>{nextLesson.room || 'P.Học'}</strong>
                </div>
              </>
            ) : (
              <>
                <div className="fs-6 fw-bold text-muted my-1">Không có lịch học sắp tới</div>
                <div className="small text-secondary mb-2" style={{ fontSize: '12px' }}>
                  Hiện chưa có tiết học tiếp theo trong hệ thống.
                </div>
              </>
            )}
            <button
              onClick={() => setActiveTab('schedule')}
              className="btn btn-link p-0 text-dark small text-decoration-none mt-auto text-start"
              style={{ fontSize: '13px' }}
            >
              Xem thời khóa biểu tuần →
            </button>
          </div>
        </div>

        {/* Thẻ 3: Tỷ lệ Chuyên cần */}
        <div className="col-12 col-md-4">
          <div className="card border rounded-1 p-3 bg-white h-100">
            <div
              className="text-secondary small fw-semibold text-uppercase"
              style={{ fontSize: '11px', letterSpacing: '0.5px' }}
            >
              Tỷ Lệ Chuyên Cần
            </div>
            <div className="d-flex align-items-baseline gap-2 my-1">
              <span className="fs-3 fw-bold text-success">{attendanceRate}%</span>
              <span className="small text-muted" style={{ fontSize: '12px' }}>
                ({presentCount}/{totalAttendance} buổi có mặt)
              </span>
            </div>
            <div className="small text-secondary mb-2" style={{ fontSize: '12px' }}>
              Vắng phép: <strong>{excusedCount}</strong> | Vắng không phép: <strong className="text-danger">{absentCount}</strong>
            </div>
            <button
              onClick={() => setActiveTab('attendance')}
              className="btn btn-link p-0 text-dark small text-decoration-none mt-auto text-start"
              style={{ fontSize: '13px' }}
            >
              Xem sổ điểm danh chi tiết →
            </button>
          </div>
        </div>
      </div>

      {/* Bảng các tiết học hôm nay */}
      <div className="card border rounded-1 bg-white">
        <div className="p-3 border-bottom d-flex justify-content-between align-items-center">
          <div>
            <h6 className="fw-bold text-dark mb-0" style={{ fontSize: '14px' }}>
              Lịch Học Hôm Nay
            </h6>
            <small className="text-secondary" style={{ fontSize: '12px' }}>
              {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
            </small>
          </div>
          <button
            onClick={() => setActiveTab('schedule')}
            className="btn btn-outline-dark btn-sm rounded-1 px-3"
            style={{ fontSize: '12px' }}
          >
            Thời khóa biểu đầy đủ
          </button>
        </div>

        <div className="table-responsive">
          <table className="table table-sm table-hover align-middle mb-0" style={{ fontSize: '13px' }}>
            <thead className="table-light">
              <tr className="text-secondary" style={{ fontSize: '11.5px' }}>
                <th className="py-2 ps-3">KHUNG GIỜ</th>
                <th className="py-2">CHỦ ĐỀ BÀI HỌC</th>
                <th className="py-2">PHÒNG HỌC</th>
                <th className="py-2">GIÁO VIÊN</th>
                <th className="py-2 text-end pe-3">TRẠNG THÁI</th>
              </tr>
            </thead>
            <tbody>
              {loadingSchedule ? (
                <tr>
                  <td colSpan="5" className="text-center py-4 text-muted">
                    Đang tải lịch học hôm nay...
                  </td>
                </tr>
              ) : todaySchedules.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-4 text-muted">
                    Hôm nay bạn không có lịch học nào. Hãy tận dụng thời gian để ôn bài nhé!
                  </td>
                </tr>
              ) : (
                todaySchedules.map((s) => {
                  const sEnd = new Date(s.endTime);
                  const sStart = new Date(s.startTime);
                  const isDone = sEnd < now;
                  const isOngoing = sStart <= now && sEnd >= now;

                  return (
                    <tr key={s.scheduleId}>
                      <td className="ps-3 font-monospace fw-semibold text-dark">
                        {formatTimeShort(s.startTime)} - {formatTimeShort(s.endTime)}
                      </td>
                      <td className="fw-semibold text-dark">
                        {s.lessonTopic || 'Tiết học theo phân phối chương trình'}
                      </td>
                      <td>
                        <span className="badge text-bg-light border text-dark rounded-1">
                          {s.room || 'P.Học'}
                        </span>
                      </td>
                      <td className="text-secondary">
                        {s.homeroomTeacherName || 'Chưa phân công'}
                      </td>
                      <td className="text-end pe-3">
                        {isOngoing ? (
                          <span className="badge text-bg-primary rounded-1">Đang diễn ra</span>
                        ) : isDone ? (
                          <span className="badge text-bg-secondary rounded-1">Đã kết thúc</span>
                        ) : (
                          <span className="badge text-bg-light border text-secondary rounded-1">Sắp diễn ra</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StudentOverviewView;
