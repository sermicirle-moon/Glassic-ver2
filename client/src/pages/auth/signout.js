import { useEffect } from 'react';
import Router from 'next/router';
import useRequest from '../../hooks/use-request';

export default () => {
  const { doRequest } = useRequest({
    url: '/api/users/signout',
    method: 'post',
    body: {},
    onSuccess: () => Router.push('/auth/signin')
  });

  useEffect(() => {
    doRequest();
  }, []);

  return (
    <div className="container py-5 text-center">
      <div className="spinner-border text-primary my-4" role="status">
        <span className="visually-hidden">Đang xử lý...</span>
      </div>
      <h4 className="text-secondary">Đang đăng xuất khỏi hệ thống...</h4>
    </div>
  );
};

