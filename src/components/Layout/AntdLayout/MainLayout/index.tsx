import { Outlet } from "react-router-dom";
import { Layout } from "antd";

export default (): JSX.Element => (
  <main className="App">
    <Layout style={{ height: "100vh" }}>
      <Outlet />
    </Layout>
  </main>
);
