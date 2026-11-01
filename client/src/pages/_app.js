import 'bootstrap/dist/css/bootstrap.css';
import buildClient from '../api/build-client';
import Header from '../components/Header';

const AppComponent = ({ Component, pageProps, currentUser }) => {
  return (
    <div className="d-flex flex-column min-vh-100 bg-light">
      <Header currentUser={currentUser} />
      <main className="flex-grow-1">
        <Component currentUser={currentUser} {...pageProps} />
      </main>
      <footer className="text-center py-3 text-muted small border-top bg-white">
        &copy; {new Date().getFullYear()} Glassic Management System. All rights reserved.
      </footer>
    </div>
  );
};

AppComponent.getInitialProps = async (appContext) => {
  const client = buildClient(appContext.ctx);
  let currentUser = null;

  try {
    const { data } = await client.get('/api/users/currentuser');
    currentUser = data.currentUser;
  } catch (err) {
    // Không đăng nhập hoặc lỗi kết nối SSR
  }

  let pageProps = {};
  if (appContext.Component.getInitialProps) {
    pageProps = await appContext.Component.getInitialProps(
      appContext.ctx,
      client,
      currentUser
    );
  }

  return {
    pageProps,
    currentUser,
  };
};

export default AppComponent;

