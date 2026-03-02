import { Link } from "react-router-dom";

const NotFoundPage = () => {
  return (
    <main className="page-wrap center-block">
      <section className="glass section-wrap">
        <h1>404</h1>
        <p>The page you requested does not exist.</p>
        <Link className="btn btn-primary" to="/">Return Home</Link>
      </section>
    </main>
  );
};

export default NotFoundPage;
