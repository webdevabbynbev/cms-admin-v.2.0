import { createElement, useEffect, useMemo, useState } from "react";
import type { ReactNode, FC } from "react";
import { Layout, Menu, Dropdown, Modal, Button, Avatar } from "antd";
import type { MenuProps } from "antd";
import {
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  LogoutOutlined,
  ExclamationCircleOutlined,
  UserOutlined,
  LockOutlined,
  SunOutlined,
  MoonOutlined,
} from "@ant-design/icons";
import { theme } from "antd";
import "./MainLayout.css";
import helper from "../utils/helper";
import http from "../api/http";
import FormChangePassword from "../components/Forms/Auth/FormChangePassword";
import FormProfile from "../components/Forms/Auth/FormProfile";
import MenuAdmin from "./Menu/Admin";
import { useNavigate, useLocation } from "react-router-dom";
import { useThemeStore } from "../hooks/useThemeStore";

interface MainLayoutProps {
  children: ReactNode;
  title?: string;
  height?: string | number;
  overflow?: "auto" | "hidden" | "scroll" | "visible";
}

const getIsMobile = () => window.innerWidth <= 768;

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(getIsMobile());

  useEffect(() => {
    const onResize = () => setIsMobile(getIsMobile());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return isMobile;
}

const MainLayout: FC<MainLayoutProps> = (props) => {
  const { token } = theme.useToken();
  const isMobile = useIsMobile();
  const { isDarkMode, toggleDarkMode } = useThemeStore();
  const [collapsed, setCollapsed] = useState(false);
  const [visiblePassword, setVisiblePassword] = useState(false);
  const [visibleProfile, setVisibleProfile] = useState(false);

  const { Header, Sider, Content } = Layout;
  const { children, title, height, overflow } = props;

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setCollapsed(isMobile);
  }, [isMobile]);

  // ✅ Stable memoized page param to prevent unnecessary re-renders
  const currentPage = useMemo(
    () => new URLSearchParams(location.search).get("page"),
    [location.search],
  );

  // ✅ Scroll to top on route change or pagination change
  useEffect(() => {
    const layoutContent = document.querySelector(".site-layout");
    if (layoutContent) {
      layoutContent.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [location.pathname, currentPage]);

  const handleMenuClick: MenuProps["onClick"] = (e) => {
    if (e.key === "/logout") {
      localStorage.removeItem("session");
      navigate("/login", { replace: true });
    } else {
      navigate(e.key);
    }
  };

  // ✅ ambil session 1x aja (biar ga panggil helper berkali-kali)
  const session = helper.isAuthenticated();
  const [menuAccess, setMenuAccess] = useState<Record<string, boolean>>(
    session?.menu_access || {},
  );

  // ✅ Refresh profile & permissions on mount
  useEffect(() => {
    http
      .get("/admin/auth/me")
      .then((res) => {
        const serve = res.data.serve;
        if (serve) {
          // Sync ke localStorage agar helper.isAuthenticated() dapet data terbaru
          const currentSession = JSON.parse(
            localStorage.getItem("session") || "{}",
          );
          const newSession = {
            ...currentSession,
            data: serve.user, // Simpan ke 'data' agar konsisten dengan LoginPage/helper
            menu_access: serve.menu_access,
          };
          localStorage.setItem("session", JSON.stringify(newSession));

          // Update state agar sidebar re-render
          setMenuAccess(serve.menu_access);
        }
      })
      .catch((err) => {
        
      });
  }, []);

  // ✅ fallback aman
  const displayName =
    session?.data?.name ||
    session?.user?.name ||
    (session?.data?.firstName
      ? `${session.data.firstName} ${session.data.lastName || ""}`
      : "John Doe");
  const roleName = (
    session?.data?.role_name ||
    session?.user?.role_name ||
    "ADMINISTRATOR"
  ).toUpperCase();
  const roleId = session?.data?.role || session?.user?.role;
  const email = session?.data?.email || session?.user?.email;

  // ✅ avatar placeholder (inisial + warna konsisten)
  const { initials, color } = helper.avatarPlaceholder(displayName, 2);

  // ✅ Logic untuk menentukan menu mana yang aktif (Highlighting)
  const getSelectedKeys = () => {
    const path = location.pathname;

    // Mapping route detail/form ke menu parent-nya
    if (path.startsWith("/product-form")) return ["/master-product"];
    if (path.startsWith("/voucher/new") || path.startsWith("/voucher/edit"))
      return ["/voucher"];
    if (path.startsWith("/discounts/")) return ["/discounts"];
    if (path.startsWith("/sales/")) return ["/sale-products"];
    if (path.startsWith("/stock-movement/adjust")) return ["/stock-movement"];
    if (path.startsWith("/flash-sales/")) return ["/flash-sale"];
    if (path === "/crm") {
      const tab = new URLSearchParams(location.search).get("tab") || "registered";
      return [`/crm?tab=${tab}`];
    }

    return [path];
  };

  // ✅ State untuk control sidebar yang terbuka (Parent Groups)
  const [openKeys, setOpenKeys] = useState<string[]>([]);

  // ✅ Auto sync openKeys saat ganti halaman (biar ga tutup sendiri)
  useEffect(() => {
    const path = location.pathname;
    const newOpenKeys = [...openKeys];

    const pairs = [
      {
        pattern: [
          "product",
          "brand",
          "inventory",
          "stock",
          "persona",
          "tag",
          "category-type",
          "concern",
          "profile-category",
        ],
        key: "#product",
      },
      {
        pattern: [
          "voucher",
          "referral",
          "sale",
          "flash",
          "discount",
          "b1g1",
          "gift",
          "ned",
          "picks",
        ],
        key: "#discounts",
      },
      { pattern: ["ramadan"], key: "#ramadan-event" },
      { pattern: ["reports"], key: "#reports" },
      {
        pattern: ["banners", "faqs", "tnc", "policy", "contact", "about"],
        key: "#content-manager",
      },
      { pattern: ["crm", "abandoned-bag"], key: "#crm" },
    ];

    pairs.forEach((p) => {
      if (
        p.pattern.some((ptr) => path.includes(ptr)) &&
        !newOpenKeys.includes(p.key)
      ) {
        newOpenKeys.push(p.key);
      }
    });

    setOpenKeys(newOpenKeys);
  }, [location.pathname]);

  return (
    <Layout>
      <Sider
        theme={isDarkMode ? "dark" : "light"}
        trigger={null}
        collapsible
        collapsed={collapsed}
        collapsedWidth={isMobile ? 0 : 80}
        width={260}
        breakpoint="lg"
        style={{
          overflowY: "auto",
          height: "100vh",
          position: "sticky",
          top: 0,
          left: 0,
        }}
      >
        <div
          className={collapsed ? "logo collapsed" : "logo"}
          style={{
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
            backgroundColor: isDarkMode ? 'transparent' : 'white'
          }}
        >
          <img src={collapsed ? "/logoAbby.svg" : "/logoAbby.svg"} alt="Logo" />
        </div>

        <Menu
          theme={isDarkMode ? "dark" : "light"}
          mode="inline"
          openKeys={openKeys}
          onOpenChange={(keys) => setOpenKeys(keys)}
          selectedKeys={getSelectedKeys()}
          onClick={handleMenuClick}
          items={MenuAdmin(roleId, menuAccess)}
        />
      </Sider>

      <Layout
        className="site-layout"
        style={{
          height: height ?? "100%",
          overflowY: overflow ?? "auto",
        }}
      >
        <Header
          className="site-layout-background flex align-center shadow"
          style={{
            padding: 0,
            marginBottom: 20,
            position: "sticky",
            top: 0,
            zIndex: 1000,
            backgroundColor: token.colorBgContainer
          }}
        >
          {createElement(collapsed ? MenuUnfoldOutlined : MenuFoldOutlined, {
            className: "trigger",
            onClick: () => setCollapsed(!collapsed),
          })}

          <span
            style={{
              marginLeft: !isMobile ? 0 : "unset",
              fontSize: !isMobile ? 17 : 15,
              marginRight: 5,
            }}
          >
            {helper.truncString(title ?? "", 30, "...")}
          </span>

          {(collapsed && isMobile) || !isMobile ? (
            <div
              className="flex align-center"
              style={{ marginLeft: "auto", marginRight: 20 }}
            >
              <div
                className="flex flex-column"
                style={{ marginRight: 10, gap: 5 }}
              >
                <span
                  style={{
                    fontSize: 12,
                    color: token.colorText,
                    fontWeight: "bold",
                    textAlign: "right",
                  }}
                >
                  {displayName}
                </span>
                <span
                  style={{
                    fontSize: 10,
                    textAlign: "right",
                    color: "var(--ant-primary-color)",
                    fontWeight: "bold",
                  }}
                >
                  {roleName}
                </span>
              </div>

              <Button
                type="text"
                icon={isDarkMode ? <SunOutlined /> : <MoonOutlined />}
                onClick={toggleDarkMode}
                style={{
                  marginRight: 16,
                  fontSize: 16,
                  color: isDarkMode ? "#fbbf24" : token.colorTextDescription,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              />

              <Dropdown
                menu={{
                  onClick: (e) => {
                    if (e.key === "/logout") {
                      Modal.confirm({
                        title: "Logout",
                        icon: <ExclamationCircleOutlined />,
                        content: "Are you sure want logout?",
                        okText: "Yes",
                        cancelText: "No",
                        okButtonProps: { type: "primary" },
                        onOk: () => {
                          http.post("/auth/logout").then(() => {
                            localStorage.removeItem("session");
                            navigate("/login", { replace: true });
                          });
                        },
                      });
                    } else if (e.key === "/change-password") {
                      setVisiblePassword(true);
                    } else {
                      navigate(e.key);
                    }
                  },
                  items: [
                    {
                      key: "/change-password",
                      icon: <LockOutlined />,
                      label: "Change Password",
                      style: { fontSize: 12 },
                    },
                    {
                      key: "/logout",
                      icon: <LogoutOutlined />,
                      label: "Logout",
                      style: {
                        fontSize: 12,
                        borderTop: `1px solid ${token.colorBorderSecondary}`,
                      },
                    },
                  ],
                }}
                trigger={["click"]}
              >
                <a href="/#" onClick={(e) => e.preventDefault()}>
                  {/* ✅ Avatar placeholder */}
                  <Avatar style={{ backgroundColor: color }}>
                    {initials === "?" ? <UserOutlined /> : initials}
                  </Avatar>
                </a>
              </Dropdown>
            </div>
          ) : null}
        </Header>

        <Content
          className="site-layout-background"
          style={{
            minHeight: 280,
            background: "unset",
            position: "relative",
          }}
        >
          {children}
          <div style={{ paddingBottom: 50 }} />
          <div
            style={{
              textAlign: "center",
              color: token.colorTextDescription,
              fontSize: 12,
              paddingBottom: 20,
            }}
          >
            Copyright &copy;
            {new Date().getFullYear()} CV. Gaya Beauty Utama | All Rights
            Reserved.
          </div>
        </Content>

        {/* Modal Password */}
        <Modal
          centered
          open={visiblePassword}
          title="Edit Password"
          onCancel={() => setVisiblePassword(false)}
          footer={[
            <Button key="back" onClick={() => setVisiblePassword(false)}>
              Cancel
            </Button>,
          ]}
        >
          <FormChangePassword
            handleClose={() => setVisiblePassword(false)}
            email={email}
            authenticated={true}
          />
        </Modal>

        {/* Modal Profile */}
        <Modal
          centered
          open={visibleProfile}
          title="Edit Profile"
          onCancel={() => setVisibleProfile(false)}
          footer={[
            <Button key="back" onClick={() => setVisibleProfile(false)}>
              Cancel
            </Button>,
          ]}
        >
          <FormProfile handleClose={() => setVisibleProfile(false)} />
        </Modal>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
