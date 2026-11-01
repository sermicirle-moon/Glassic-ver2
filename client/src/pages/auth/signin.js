import { useState } from 'react';
import Router from 'next/router';
import Link from 'next/link';
import useRequest from '../../hooks/use-request';

export default () => {
  const [role, setRole] = useState('STUDENT');
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');

  const { doRequest, errors, loading } = useRequest({
    url: '/api/users/signin',
    method: 'post',
    body: { id, password, role },
    onSuccess: () => Router.push('/')
  });

  const onSubmit = async (event) => {
    event.preventDefault();
    await doRequest();
  };

  const getPlaceholder = () => {
    if (role === 'STUDENT') return 'VD: HS001 hoặc mã UserID...';
    if (role === 'TEACHER') return 'VD: GV001 hoặc mã UserID...';
    return 'Mã định danh Admin (6 ký tự)...';
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-12 col-md-6 col-lg-4">
          <div className="card border rounded-1 bg-white">
            <div className="card-body p-4">
              <div className="mb-4">
                <span className="badge text-bg-light border text-secondary rounded-1 mb-2">
                  Hệ thống Glassic
                </span>
                <h4 className="fw-bold text-dark mb-1">Đăng Nhập</h4>
                <p className="text-secondary small mb-0">
                  Chọn vai trò và nhập thông tin tài khoản
                </p>
              </div>

              <form onSubmit={onSubmit}>
                <div className="mb-3">
                  <label className="form-label small fw-semibold text-secondary">
                    Vai trò đăng nhập
                  </label>
                  <select
                    className="form-select form-select-sm rounded-1"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                  >
                    <option value="STUDENT">Học sinh</option>
                    <option value="TEACHER">Giáo viên</option>
                    <option value="ADMIN">Quản trị viên</option>
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold text-secondary">
                    Mã tài khoản (ID / UserID)
                  </label>
                  <input
                    value={id}
                    onChange={(e) => setId(e.target.value)}
                    className="form-control form-control-sm rounded-1"
                    placeholder={getPlaceholder()}
                    autoFocus
                  />
                  <div className="form-text" style={{ fontSize: '11px' }}>
                    Sử dụng mã học sinh, mã giáo viên hoặc UserID được cấp.
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold text-secondary">
                    Mật khẩu
                  </label>
                  <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type="password"
                    className="form-control form-control-sm rounded-1"
                    placeholder="Nhập mật khẩu..."
                  />
                </div>

                {errors}

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-dark btn-sm w-100 fw-semibold rounded-1 py-2 mt-2"
                >
                  {loading ? 'Đang xác thực...' : 'Đăng Nhập'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
