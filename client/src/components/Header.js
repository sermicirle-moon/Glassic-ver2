import Link from 'next/link';

export default ({ currentUser }) => {
  const links = [
    !currentUser && { label: 'Đăng nhập', href: '/auth/signin' },
    !currentUser && { label: 'Đăng ký Admin', href: '/auth/signup' },
    currentUser && currentUser.role === 'ADMIN' && { label: 'Lớp học', href: '/?tab=classes' },
    currentUser && currentUser.role === 'ADMIN' && { label: 'Giáo viên', href: '/?tab=teachers' },
    currentUser && currentUser.role === 'ADMIN' && { label: 'Học sinh', href: '/?tab=students' },
    currentUser && currentUser.role === 'TEACHER' && { label: 'Lớp của tôi', href: '/' },
    currentUser && { label: 'Đăng xuất', href: '/auth/signout' },
  ]
    .filter((linkConfig) => linkConfig)
    .map(({ label, href }) => {
      const isSignout = href === '/auth/signout';
      return (
        <li key={href} className="nav-item">
          <Link
            href={href}
            className={`nav-link px-3 ${isSignout ? 'text-danger' : 'text-dark'}`}
            style={{ fontSize: '14px', fontWeight: 500 }}
          >
            {label}
          </Link>
        </li>
      );
    });

  return (
    <nav className="navbar navbar-expand-lg bg-white border-bottom px-4 py-2">
      <div className="container-fluid px-0">
        <Link
          href="/"
          className="navbar-brand fw-bold text-dark text-uppercase tracking-wider"
          style={{ letterSpacing: '1px', fontSize: '18px' }}
        >
          Glassic
        </Link>

        <div className="d-flex align-items-center">
          {currentUser && (
            <div className="me-3 small text-secondary">
              <span className="badge text-bg-light border me-2 rounded-1 fw-normal">
                {currentUser.role}
              </span>
              <span>{currentUser.username}</span>
            </div>
          )}
          <ul className="navbar-nav d-flex flex-row gap-1">{links}</ul>
        </div>
      </div>
    </nav>
  );
};