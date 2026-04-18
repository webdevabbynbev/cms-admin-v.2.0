import React from "react";
import { Tabs, Typography, Tag } from "antd";
import { RiseOutlined, ExperimentOutlined, LineChartOutlined } from "@ant-design/icons";
import SeoDashboardPanel from "../../components/Panels/Seo/SeoDashboardPanel";
import SeoTrafficPanel from "../../components/Panels/Seo/SeoTrafficPanel";
import LookerStudioPanel from "../../components/Panels/Seo/LookerStudioPanel";
import { useThemeStore } from "../../hooks/useThemeStore";

const { Title, Text } = Typography;

const SeoReportPage: React.FC = () => {
    const { isDarkMode } = useThemeStore();
    const items = [
        {
            key: "dashboard",
            label: (
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <RiseOutlined /> SEO Dashboard
                </span>
            ),
            children: <SeoDashboardPanel />,
        },
        {
            key: "traffic",
            label: (
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <ExperimentOutlined /> Traffic Report
                </span>
            ),
            children: <SeoTrafficPanel />,
        },
        {
            key: "looker",
            label: (
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <LineChartOutlined /> Looker Studio
                </span>
            ),
            children: <LookerStudioPanel />,
        },
    ];

    return (
        <div style={{ padding: "28px 32px", background: isDarkMode ? "#141414" : "#f5f7fa", minHeight: "100vh" }}>
            {/* Header */}
            <div style={{
                background: isDarkMode ? "#1f1f1f" : "#ffffff",
                borderRadius: "16px",
                padding: "24px 36px",
                marginBottom: 28,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                boxShadow: isDarkMode ? "0 4px 20px rgba(0,0,0,0.4)" : "0 4px 20px rgba(0,0,0,0.06)",
                border: isDarkMode ? "1px solid #303030" : "1px solid #f0f0f0",
                borderLeft: "8px solid #ff6eb4",
            }}>
                <div>
                    <Text style={{ color: "#ff6eb4", opacity: 0.8, fontSize: 13, letterSpacing: 1, textTransform: "uppercase", fontWeight: 600 }}>
                        CMS Analytics
                    </Text>
                    <Title level={2} style={{ color: isDarkMode ? "#ff6eb4" : "#b31f5f", margin: "4px 0 0", fontWeight: 700 }}>
                        SEO Report Module
                    </Title>
                    <Text style={{ color: isDarkMode ? "rgba(255,255,255,0.65)" : "#64748b", fontSize: 13 }}>
                        Data diperbarui otomatis dari Google Analytics & Search Console
                    </Text>
                </div>
                <Tag
                    color="orange"
                    style={{
                        fontSize: 12,
                        padding: "6px 14px",
                        borderRadius: 20,
                        fontWeight: 600,
                        border: "none",
                        background: isDarkMode ? "rgba(255,165,0,0.1)" : "rgba(255,165,0,0.1)",
                        color: isDarkMode ? "#ffbb96" : "#fa8c16",
                    }}
                >
                    ⚠ Preview Mode — Data Simulasi
                </Tag>
            </div>

            {/* Tabs */}
            <div style={{
                background: isDarkMode ? "#1f1f1f" : "#fff",
                borderRadius: 16,
                padding: "8px 24px 24px",
                boxShadow: isDarkMode ? "0 2px 16px rgba(0,0,0,0.3)" : "0 2px 16px rgba(0,0,0,0.06)",
                border: isDarkMode ? "1px solid #303030" : "none",
            }}>
                <Tabs
                    defaultActiveKey="dashboard"
                    items={items}
                    style={{ marginTop: 8 }}
                    tabBarStyle={{ borderBottom: isDarkMode ? "1px solid #303030" : "1px solid #f0f0f0", marginBottom: 24 }}
                    size="large"
                />
            </div>
        </div>
    );
};

export default SeoReportPage;
