import React from "react";
import { Tabs, Typography, Tooltip, Space, Tag, Button, Dropdown, message, type MenuProps, theme, Grid } from "antd";
import { 
    InfoCircleOutlined, 
    UserOutlined, 
    ExportOutlined, 
    FileExcelOutlined, 
    FileTextOutlined,
    RocketOutlined,
    ShareAltOutlined,
    CrownOutlined,
} from "@ant-design/icons";
import { useSearchParams } from "react-router-dom";
import { useThemeStore } from "../hooks/useThemeStore";
import http from "../api/http";

// New Tab Components
import CRMMemberTab from "../components/Tables/SupabaseUser/CRMMemberTab";
import CRMUpgradePathTab from "../components/Tables/SupabaseUser/CRMUpgradePathTab";
import CRMAffiliateTab from "../components/Tables/SupabaseUser/CRMAffiliateTab";

const { Title, Text } = Typography;

const tabTooltips: Record<string, string> = {
    "member": "Manajemen Member: Kelola tier (Customer, ABeauties, ABMUA, ABCD) dan pantau performa member secara individual.",
    "upgrade": "Upgrade Path: Pantau member yang potensial naik tier berdasarkan kelengkapan profil M1 dan pengajuan ABMUA.",
    "affiliate": "Affiliate M5: Kelola program referral, pantau klik, konversi, dan komisi dari ABMUA dan ABCD/KOL.",
};

const tabLabel = (key: string, label: string, icon: React.ReactNode, isMobile = false) => (
    <Space size={4}>
        {icon}
        {label}
        <Tooltip
            title={tabTooltips[key]}
            placement="bottom"
            trigger={isMobile ? ["click"] : ["hover"]}
        >
            <InfoCircleOutlined style={{ fontSize: 10, color: "#aaa" }} />
        </Tooltip>
    </Space>
);

export default function CRMPage() {
    const { isDarkMode } = useThemeStore();
    const { token } = theme.useToken();
    const screens = Grid.useBreakpoint();
    const isMobile = !screens.md;
    const [searchParams, setSearchParams] = useSearchParams();
    let activeTab = searchParams.get("tab") || "member";

    // Handle backward compatibility for old tab keys
    if (activeTab === "registered" || activeTab === "abandoned") activeTab = "member";

    const onTabChange = (key: string) => {
        setSearchParams((prev) => {
            prev.set("tab", key);
            return prev;
        });
    };

    const handleExport = async (format: 'csv' | 'xlsx') => {
        const type = 'registered';
        const hide = message.loading(`Menyiapkan data ${format.toUpperCase()}...`, 0);
        try {
            const q = searchParams.get('q');
            let apiUrl = `/admin/crm-export/${type}?format=${format}`;
            if (q) apiUrl += `&q=${encodeURIComponent(q)}`;

            const response = await http.get(apiUrl, { responseType: 'blob' });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            const timestamp = new Date().toISOString().split('T')[0];
            link.setAttribute('download', `crm_${type}_${timestamp}.${format}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            message.success('Ekspor berhasil');
        } catch {
            message.error('Gagal melakukan ekspor');
        } finally {
            hide();
        }
    };

    const exportMenu: MenuProps = {
        items: [
            { key: 'excel', label: 'Ekspor Excel (.xlsx)', icon: <FileExcelOutlined style={{ color: '#1d6f42' }} />, onClick: () => handleExport('xlsx') },
            { key: 'csv', label: 'Ekspor CSV', icon: <FileTextOutlined />, onClick: () => handleExport('csv') },
        ],
    };

    const items = [
        {
            key: "member",
            label: tabLabel("member", "Member", <UserOutlined />, isMobile),
            children: <CRMMemberTab />,
        },
        {
            key: "upgrade",
            label: tabLabel("upgrade", "Upgrade Path", <RocketOutlined />, isMobile),
            children: <CRMUpgradePathTab />,
        },
        {
            key: "affiliate",
            label: tabLabel("affiliate", "Affiliate M5", <ShareAltOutlined />, isMobile),
            children: <CRMAffiliateTab />,
        },
    ];

    return (
        <div style={{
            padding: isMobile ? 12 : 24,
            minHeight: '100vh',
            background: isDarkMode ? '#0c0c0c' : '#f8f9fa',
        }}>
            {/* Liquid Glass Header */}
            <div style={{ 
                marginBottom: isMobile ? 16 : 32, 
                padding: isMobile ? "14px 14px" : "24px 32px", 
                display: 'flex', 
                flexDirection: isMobile ? "column" : "row",
                justifyContent: 'space-between',
                alignItems: isMobile ? "flex-start" : 'center',
                gap: isMobile ? 12 : 0,
                background: isDarkMode 
                    ? 'linear-gradient(135deg, rgba(31,31,31,0.8), rgba(20,20,20,0.8))' 
                    : 'linear-gradient(135deg, rgba(255,255,255,0.7), rgba(255,255,255,0.4))',
                borderRadius: 20, 
                backdropFilter: 'blur(20px)',
                border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.6)'}`,
                boxShadow: isDarkMode 
                    ? '0 8px 32px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(255,255,255,0.05)' 
                    : '0 8px 32px rgba(179,31,95,0.08), inset 0 0 0 1px rgba(255,255,255,1)',
            }}>
                <div>
                    <Space align="center" size={12}>
                        <div style={{ 
                            width: 10, 
                            height: 24, 
                            background: 'linear-gradient(to bottom, #b31f5f, #1890ff)', 
                            borderRadius: 4 
                        }} />
                        <Title level={isMobile ? 4 : 3} style={{ margin: 0, letterSpacing: -0.5 }}>
                            CRM Dashboard <span style={{ color: '#b31f5f', fontWeight: 300 }}>v2.0</span>
                        </Title>
                        <Tag color="blue" bordered={false} style={{ borderRadius: 8, padding: "0 10px", fontWeight: 600 }}>
                            <CrownOutlined /> PREMIA
                        </Tag>
                    </Space>
                    <Text type="secondary" style={{ display: "block", marginTop: 6, fontSize: isMobile ? 12 : 13, maxWidth: 600 }}>
                        Pusat kendali ekosistem pelanggan Abby & Bev. Kelola member tier, pantau jalur upgrade M1-M4, dan optimalkan pendapatan affiliate M5.
                    </Text>
                </div>

                <div style={{ display: "flex", gap: 12, width: isMobile ? "100%" : "auto" }}>
                    <Dropdown menu={exportMenu} placement="bottomRight">
                        <Button 
                            type="primary" 
                            icon={<ExportOutlined />} 
                            style={{ 
                                background: 'linear-gradient(135deg, #b31f5f, #db2777)', 
                                border: 'none',
                                height: 40,
                                borderRadius: 10,
                                fontWeight: 600,
                                boxShadow: '0 4px 12px rgba(179,31,95,0.3)',
                                width: isMobile ? "100%" : "auto",
                            }}
                        >
                            Ekspor Global
                        </Button>
                    </Dropdown>
                </div>
            </div>

            {/* Custom Styled Tabs */}
            <style>{`
                .crm-tabs .ant-tabs-nav {
                    background: ${isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'};
                    padding: 8px;
                    border-radius: 12px;
                    margin-bottom: ${isMobile ? "14px" : "24px"};
                }
                .crm-tabs .ant-tabs-nav-wrap {
                    overflow: visible !important;
                }
                .crm-tabs .ant-tabs-nav-list {
                    ${isMobile ? "display: grid !important;" : ""}
                    ${isMobile ? "grid-template-columns: repeat(2, minmax(0, 1fr));" : ""}
                    ${isMobile ? "width: 100%;" : ""}
                    ${isMobile ? "gap: 4px;" : ""}
                }
                .crm-tabs .ant-tabs-tab {
                    border-radius: 8px !important;
                    transition: all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);
                    padding: ${isMobile ? "8px 12px" : "8px 20px"} !important;
                    margin: ${isMobile ? "0 !important" : "0 4px !important"};
                    border: none !important;
                    background: transparent !important;
                    white-space: nowrap !important;
                    justify-content: center;
                }
                .crm-tabs .ant-tabs-tab-active {
                    background: ${token.colorBgContainer} !important;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.05) !important;
                }
                .crm-tabs .ant-tabs-tab-active .ant-tabs-tab-btn {
                    color: #b31f5f !important;
                    font-weight: 700 !important;
                }
                .crm-tabs .ant-tabs-ink-bar {
                    display: none;
                }
            `}</style>
            
            <Tabs 
                activeKey={activeTab} 
                onChange={onTabChange} 
                items={items} 
                className="crm-tabs"
            />
        </div>
    );
}
