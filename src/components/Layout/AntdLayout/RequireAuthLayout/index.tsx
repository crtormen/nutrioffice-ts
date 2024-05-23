import { ReactNode } from "react";
import { useLocation, Navigate, Outlet } from "react-router-dom";
import { Layout } from "antd";
import { useAuth } from "@/infra/firebase/hooks";
import MainHeader from "../MainHeader";
import Aside from "../Aside";
import Content from "../Content";

interface AuthProps {
  // isAllowed: boolean,
  // redirectPath: string,
  children?: ReactNode;
}

const RequireAuthLayout = ({ children }: AuthProps) => {
  const { user } = useAuth();
  const location = useLocation();

  //if (!isAllowed)
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;

  return children ? (
    children
  ) : (
    <Layout>
      <MainHeader />
      <Layout hasSider>
        <Aside />
        <Content>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default RequireAuthLayout;
