import React from "react";
import { Layout } from "antd";
import "./styles.css";

interface Props {
  children?: React.ReactNode;
}
const Content = ({ children }: Props) => {
  return <Layout className="container">{children}</Layout>;
};

export default Content;
