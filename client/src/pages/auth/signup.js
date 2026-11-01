import { useState } from 'react';
import Router from 'next/router';
import Link from 'next/link';
import useRequest from '../../hooks/use-request';

export default () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const { doRequest, errors, loading } = useRequest({
    url: '/api/users/signup',
    method: 'post',
    body: { username, password },
    onSuccess: () => Router.push('/')
  });

  const onSubmit = async (event) => {
    event.preventDefault();
    await doRequest();
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-12 col-md-6 col-lg-4">
          <div className="card border rounded-1 bg-white">
            <div className="card-body p-4">
              <div className="mb-4">
                <span className="badge text-bg-light border text-secondary rounded-1 mb-2">
                  Quản trị viên
                </span>
                <h4 className="fw-bold text-dark mb-1">Đăng Ký Admin</h4>
                <p className="text-secondary small mb-0">
                  Tạo tài khoản Quản trị viên khởi đầu cho trường học
                </p>
              </div>

              <form onSubmit={onSubmit}>
                <div className="mb-3">
                  <label className="form-label small fw-semibold text-secondary">
                    Tên tài khoản (Username)
                  </label>
                  <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="form-control form-control-sm rounded-1"
                    placeholder="VD: admin_hieu_truong"
                    autoFocus
                  />
                  <div className="form-text" style={{ fontSize: '11px' }}>
                    Độ dài từ 3 đến 30 ký tự (cho phép trùng tên).
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold text-secondary">
                    Mật khẩu quản trị
                  </label>
                  <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type="password"
                    className="form-control form-control-sm rounded-1"
                    placeholder="Tối thiểu 6 ký tự..."
                  />
                </div>

                {errors}

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-dark btn-sm w-100 fw-semibold rounded-1 py-2 mt-2"
                >
                  {loading ? 'Đang khởi tạo...' : 'Tạo Tài Khoản Admin'}
                </button>
              </form>

              <div className="mt-4 pt-3 text-center border-top">
                <p className="text-secondary small mb-0">
                  Đã có tài khoản?{' '}
                  <Link href="/auth/signin" className="text-dark fw-semibold text-decoration-none">
                    Quay lại Đăng nhập
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
