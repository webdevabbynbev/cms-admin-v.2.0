import React, { useEffect, useState } from "react";
import { Card, Table, Row, Col, Statistic, Skeleton, Tag } from "antd";
import { FileTextOutlined, ShoppingCartOutlined } from "@ant-design/icons";
import { getSeoTrafficReport, getSeoPerformance, type TrafficReport, type SeoPerformance } from "../../../api/seo";
import { useThemeStore } from "../../../hooks/useThemeStore";

const SeoTrafficPanel: React.FC = () => {
    const { isDarkMode } = useThemeStore();
    const [trafficData, setTrafficData] = useState<TrafficReport | null>(null);
    const [perfData, setPerfData] = useState<SeoPerformance | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [trafficRes, perfRes] = await Promise.all([
                getSeoTrafficReport(),
                getSeoPerformance(),
            ]);
            setTrafficData(trafficRes);
            setPerfData(perfRes);
        } catch (error) {
            
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        {
            title: "Page",
            dataIndex: "page",
            key: "page",
            render: (text: string) => <a href={text} target="_blank" rel="noopener noreferrer" style={{ color: isDarkMode ? "#ff6eb4" : undefined }}>{text}</a>,
        },
        {
            title: "Clicks",
            dataIndex: "clicks",
            key: "clicks",
            sorter: (a: any, b: any) => a.clicks - b.clicks,
        },
        {
            title: "Impressions",
            dataIndex: "impressions",
            key: "impressions",
            sorter: (a: any, b: any) => a.impressions - b.impressions,
        },
        {
            title: "CTR",
            dataIndex: "ctr",
            key: "ctr",
            render: (val: number) => `${(val * 100).toFixed(2)}%`,
        },
        {
            title: "Position",
            dataIndex: "position",
            key: "position",
            render: (val: number) => <Tag color={isDarkMode ? "magenta" : "blue"}>{val.toFixed(1)}</Tag>,
        },
    ];

    if (loading) return <Skeleton active />;

    return (
        <div className="space-y-6">
            <Row gutter={16}>
                <Col span={12}>
                    <Card style={{
                        borderRadius: 14,
                        borderLeft: "4px solid #52c41a",
                        boxShadow: isDarkMode ? "0 2px 12px rgba(0,0,0,0.3)" : "0 2px 12px rgba(0,0,0,0.06)",
                        background: isDarkMode ? "#1f1f1f" : "#fff",
                        border: isDarkMode ? "1px solid #303030" : "1px solid #f0f0f0",
                        borderLeftColor: "#52c41a",
                    }}>
                        <Statistic
                            title={<span style={{ color: isDarkMode ? "rgba(255,255,255,0.45)" : undefined }}>Blog Performance (Clicks)</span>}
                            value={perfData?.blog.clicks}
                            valueStyle={{ color: isDarkMode ? "#fff" : undefined }}
                            prefix={<FileTextOutlined style={{ color: "#52c41a" }} />}
                        />
                        <div style={{ fontSize: 12, color: isDarkMode ? "rgba(255,255,255,0.45)" : "#6b7280", marginTop: 8 }}>
                            Impressions: {perfData?.blog.impressions.toLocaleString()}
                        </div>
                    </Card>
                </Col>
                <Col span={12}>
                    <Card style={{
                        borderRadius: 14,
                        borderLeft: "4px solid #fa8c16",
                        boxShadow: isDarkMode ? "0 2px 12px rgba(0,0,0,0.3)" : "0 2px 12px rgba(0,0,0,0.06)",
                        background: isDarkMode ? "#1f1f1f" : "#fff",
                        border: isDarkMode ? "1px solid #303030" : "1px solid #f0f0f0",
                        borderLeftColor: "#fa8c16",
                    }}>
                        <Statistic
                            title={<span style={{ color: isDarkMode ? "rgba(255,255,255,0.45)" : undefined }}>E-commerce Performance (Clicks)</span>}
                            value={perfData?.ecommerce.clicks}
                            valueStyle={{ color: isDarkMode ? "#fff" : undefined }}
                            prefix={<ShoppingCartOutlined style={{ color: "#fa8c16" }} />}
                        />
                        <div style={{ fontSize: 12, color: isDarkMode ? "rgba(255,255,255,0.45)" : "#6b7280", marginTop: 8 }}>
                            Impressions: {perfData?.ecommerce.impressions.toLocaleString()}
                        </div>
                    </Card>
                </Col>
            </Row>

            <Card
                title={<span style={{ color: isDarkMode ? "#fff" : undefined }}>Top Performant Pages (Search Console)</span>}
                style={{
                    borderRadius: 14,
                    boxShadow: isDarkMode ? "0 2px 12px rgba(0,0,0,0.3)" : "0 2px 12px rgba(0,0,0,0.06)",
                    background: isDarkMode ? "#1f1f1f" : "#fff",
                    border: isDarkMode ? "1px solid #303030" : "1px solid #f0f0f0",
                }}
                bodyStyle={{ padding: 0 }}
            >
                <Table
                    dataSource={trafficData?.top_pages.slice(0, 3)}
                    columns={columns}
                    rowKey="page"
                    pagination={false}
                    size="middle"
                />
            </Card>
        </div>
    );
};

export default SeoTrafficPanel;
