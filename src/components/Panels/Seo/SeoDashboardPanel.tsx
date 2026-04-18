import React, { useEffect, useState } from "react";
import { Row, Col, Skeleton, Divider } from "antd";
import {
    UserOutlined, UserAddOutlined, TeamOutlined,
    RiseOutlined,
} from "@ant-design/icons";
import {
    PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip,
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { getSeoDashboardSummary, type SeoSummary } from "../../../api/seo";
import { useThemeStore } from "../../../hooks/useThemeStore";

const COLORS = ["#b31f5f", "#e85d9e", "#f4a7c9", "#4f46e5", "#818cf8", "#38bdf8", "#34d399", "#fb923c", "#a78bfa", "#94a3b8"];

const StatCard: React.FC<{
    label: string;
    value: number | undefined;
    icon: React.ReactNode;
    color: string;
    bg: string;
    isDarkMode: boolean;
    suffix?: string;
}> = ({ label, value, icon, color, bg, isDarkMode, suffix = "" }) => (
    <div style={{
        background: isDarkMode ? "#1f1f1f" : "#fff",
        borderRadius: 14,
        padding: "20px 24px",
        display: "flex",
        alignItems: "center",
        gap: 16,
        boxShadow: isDarkMode ? "0 2px 12px rgba(0,0,0,0.3)" : "0 2px 12px rgba(0,0,0,0.06)",
        border: isDarkMode ? "1px solid #303030" : "1px solid #f0f0f0",
        height: "100%",
    }}>
        <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: isDarkMode ? "rgba(255,255,255,0.05)" : bg,
            display: "flex",
            alignItems: "center", justifyContent: "center",
            fontSize: 22, color: color, flexShrink: 0,
        }}>
            {icon}
        </div>
        <div>
            <div style={{ fontSize: 12, color: isDarkMode ? "rgba(255,255,255,0.45)" : "#94a3b8", fontWeight: 500, textTransform: "uppercase", letterSpacing: 0.5 }}>
                {label}
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, color: isDarkMode ? "#fff" : "#1e293b", lineHeight: 1.2, marginTop: 2 }}>
                {value !== undefined ? value.toLocaleString("id-ID") : "—"}{suffix}
            </div>
        </div>
    </div>
);

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div style={{ background: "#1e293b", padding: "8px 14px", borderRadius: 8, color: "#fff", fontSize: 13 }}>
                <div style={{ fontWeight: 600 }}>{label || payload[0]?.name}</div>
                <div style={{ color: "#94a3b8" }}>{payload[0]?.value?.toLocaleString("id-ID")} sesi</div>
            </div>
        );
    }
    return null;
};

const SeoDashboardPanel: React.FC = () => {
    const { isDarkMode } = useThemeStore();
    const [data, setData] = useState<SeoSummary | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await getSeoDashboardSummary();
            setData(res);
        } catch (error) {
            
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <Skeleton active paragraph={{ rows: 8 }} />;

    const totalSessions = data?.traffic_source.reduce((s, i) => s + i.value, 0) || 1;

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Stat Cards */}
            <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} md={8}>
                    <StatCard
                        label="Total Users"
                        value={data?.metrics.totalUsers}
                        icon={<TeamOutlined />}
                        color="#b31f5f"
                        bg="#fdf2f8"
                        isDarkMode={isDarkMode}
                    />
                </Col>
                <Col xs={24} sm={12} md={8}>
                    <StatCard
                        label="New Users"
                        value={data?.metrics.newUsers}
                        icon={<UserAddOutlined />}
                        color="#4f46e5"
                        bg="#eef2ff"
                        isDarkMode={isDarkMode}
                    />
                </Col>
                <Col xs={24} sm={12} md={8}>
                    <StatCard
                        label="Total Sessions"
                        value={totalSessions}
                        icon={<UserOutlined />}
                        color="#0891b2"
                        bg="#ecfeff"
                        isDarkMode={isDarkMode}
                    />
                </Col>
            </Row>

            {/* Charts Row */}
            <Row gutter={[16, 16]}>
                {/* Pie Chart */}
                <Col xs={24} lg={12}>
                    <div style={{
                        background: isDarkMode ? "#1f1f1f" : "#fff",
                        borderRadius: 14,
                        padding: "20px 24px",
                        boxShadow: isDarkMode ? "0 2px 12px rgba(0,0,0,0.3)" : "0 2px 12px rgba(0,0,0,0.06)",
                        border: isDarkMode ? "1px solid #303030" : "1px solid #f0f0f0",
                        height: "100%",
                    }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                            <RiseOutlined style={{ color: "#b31f5f" }} />
                            <span style={{ fontWeight: 700, fontSize: 15, color: isDarkMode ? "#fff" : "#1e293b" }}>Traffic Sources</span>
                        </div>
                        <Divider style={{ margin: "0 0 16px", borderColor: isDarkMode ? "#303030" : "#f0f0f0" }} />
                        <ResponsiveContainer width="100%" height={280}>
                            <PieChart>
                                <Pie
                                    data={data?.traffic_source}
                                    cx="50%" cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={3}
                                    dataKey="value"
                                >
                                    {data?.traffic_source.map((_e, i) => (
                                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                                <Legend
                                    iconType="circle"
                                    iconSize={10}
                                    formatter={(v) => <span style={{ fontSize: 12, color: isDarkMode ? "rgba(255,255,255,0.45)" : "#64748b" }}>{v}</span>}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </Col>

                {/* Bar Chart */}
                <Col xs={24} lg={12}>
                    <div style={{
                        background: isDarkMode ? "#1f1f1f" : "#fff",
                        borderRadius: 14,
                        padding: "20px 24px",
                        boxShadow: isDarkMode ? "0 2px 12px rgba(0,0,0,0.3)" : "0 2px 12px rgba(0,0,0,0.06)",
                        border: isDarkMode ? "1px solid #303030" : "1px solid #f0f0f0",
                        height: "100%",
                    }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                            <RiseOutlined style={{ color: "#4f46e5" }} />
                            <span style={{ fontWeight: 700, fontSize: 15, color: isDarkMode ? "#fff" : "#1e293b" }}>Sesi per Sumber</span>
                        </div>
                        <Divider style={{ margin: "0 0 16px", borderColor: isDarkMode ? "#303030" : "#f0f0f0" }} />
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={data?.traffic_source} layout="vertical" margin={{ left: 16 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={isDarkMode ? "#303030" : "#f1f5f9"} />
                                <XAxis type="number" tick={{ fontSize: 11, fill: isDarkMode ? "rgba(255,255,255,0.45)" : "#94a3b8" }} axisLine={false} tickLine={false} />
                                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: isDarkMode ? "rgba(255,255,255,0.65)" : "#475569" }} axisLine={false} tickLine={false} width={90} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                                    {data?.traffic_source.map((_e, i) => (
                                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Col>
            </Row>
        </div>
    );
};

export default SeoDashboardPanel;
