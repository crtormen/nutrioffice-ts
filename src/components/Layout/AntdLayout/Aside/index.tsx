import React, { useState } from "react";
import { Layout, Divider, Menu } from "antd";
import type { MenuProps } from "antd";
import {
  DollarCircleOutlined,
  SolutionOutlined,
  UserOutlined,
  HomeOutlined,
} from "@ant-design/icons";
import { Link, NavLink } from "react-router-dom";
import logo from "@/assets/images/logo-80px.png";
import "./styles.css";

const Sider = Layout.Sider;
type MenuItem = Required<MenuProps>["items"][number];

function getItem(
  label: React.ReactNode,
  key: React.Key,
  icon?: React.ReactNode,
  children?: MenuItem[],
  type?: "group"
): MenuItem {
  return {
    key,
    icon,
    children,
    label,
    type,
  } as MenuItem;
}

const items: MenuItem[] = [
  getItem(
    "Home",
    "1",
    <NavLink to="/">
      <HomeOutlined />
    </NavLink>
  ),
  getItem(
    "Pacientes",
    "2",
    <NavLink to="/pacientes">
      <UserOutlined />
    </NavLink>
  ),
  getItem(
    "Consultas",
    "3",
    <NavLink to="/consultas">
      <SolutionOutlined />
    </NavLink>
  ),
  getItem(
    "Finanças",
    "4",
    <NavLink to="/finances">
      <DollarCircleOutlined />
    </NavLink>
  ),
];

const Aside = (): JSX.Element => {
  const [collapsed, setCollapsed] = useState(false);
  const [collapsedWidth, setCollapsedWidth] = useState(80);

  const onCollapse = (collapsed: boolean) => {
    setCollapsed(collapsed);
  };

  const handleBreakPoint = (broken: boolean) => {
    let collapsedWidth = broken ? 0 : 80;
    setCollapsedWidth(collapsedWidth);
  };

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={onCollapse}
      collapsedWidth={collapsedWidth}
      // trigger={null}
      breakpoint="lg"
      theme="light"
      onBreakpoint={handleBreakPoint}
      className="sider"
    >
      <div className="sider__logo">
        <Link to="/">
          <img alt="logo nutri office" src={logo} />
        </Link>
      </div>
      <Divider />
      <Menu
        theme="light"
        mode="inline"
        defaultSelectedKeys={["1"]}
        items={items}
      />
      {/* <Menu.Item key="/dashboard">
          <NavLink to="/dashboard">
            <HomeOutlined />
            <span>Home</span>
          </NavLink>
        </Menu.Item>
        <Menu.Item key="/pacientes">
          <NavLink to="/pacientes">
            <UserOutlined />
            <span>Pacientes</span>
          </NavLink>
        </Menu.Item>
        <Menu.Item key="/consultas">
          <NavLink to="/consultas">
            <SolutionOutlined />
            <span>Consultas</span>
          </NavLink>
        </Menu.Item>
        <Menu.Item key="/finances">
          <NavLink to="/finances">
            <DollarCircleOutlined />
            <span>Finanças</span>
          </NavLink>
        </Menu.Item>
      </Menu> */}
    </Sider>
  );
};

export default Aside;
