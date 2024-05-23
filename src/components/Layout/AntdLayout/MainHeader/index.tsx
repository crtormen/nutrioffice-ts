import React from "react";
import { Layout, Button } from "antd";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/infra/firebase";
import "./styles.css";

const Header = Layout.Header;

const MainHeader = () => {
  const { signout } = useAuth();
  const navigate = useNavigate();

  return (
    <Header className="header">
      <div className="header__content">
        <Button
          className="button button__link"
          onClick={() => signout(() => navigate("/login"))}
        >
          Logout
        </Button>
      </div>
    </Header>
  );
};

export default MainHeader;
