import React, { useState, useEffect } from "react";
import {
    Table,
    Tag,
    Card,
    message,
    Tooltip,
    Space,
    Avatar,
    Typography,
    Input,
    Select,
    Button,
    DatePicker,
    InputNumber,
    Row,
    Col,
    theme
} from "antd";
import type { ColumnsType, TableProps } from "antd/es/table";
import {
    QuestionCircleOutlined,
    UserOutlined,
    ReloadOutlined,
    LineChartOutlined,
    DollarOutlined,
    ShoppingCartOutlined,
    MailOutlined
} from "@ant-design/icons";
import http from "../../../api/http";
import moment from "moment";
import dayjs from "dayjs";
import { useSearchParams } from "react-router-dom";

const { Text } = Typography;
const { RangePicker } = DatePicker;

type SupabaseUser = {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    name: string;
    phoneNumber: string | null;
    phone?: string | null;
    lastSignInAt: string | null;
    createdAt: string;
    emailVerified?: string | number | null;
    role_name: string;
    total_orders: number;
    ltv: number;
    photo_profile_url?: string;
};

interface UserSummary {
    total_users: number;
    total_revenue: number;
    total_success_transactions: number;
    avg_ltv: number;
}


const ColHeader = ({ label, tooltip }: { label: string; tooltip: string }) => (
    <Space size={4}>
        {label}
        <Tooltip title={tooltip}>
            <QuestionCircleOutlined style={{ color: "#aaa", cursor: "help" }} />
        </Tooltip>
    </Space>
);

const LOYALTY_TAGS: Record<string, { color: string, label: string }> = {
    'BIG SPENDER': { color: 'gold', label: 'BIG SPENDER' },
    'LOYAL': { color: 'purple', label: 'LOYAL' },
    'CUSTOMER': { color: 'blue', label: 'PELANGGAN' },
    'NEW USER': { color: 'green', label: 'PENGGUNA BARU' }
};

const columns: ColumnsType<SupabaseUser> = [
    {
        title: <ColHeader label="Pelanggan" tooltip="Nama dan email pelanggan." />,
        key: "name",
        render: (_, rec) => (
            <Space>
                <Avatar src={rec.photo_profile_url} icon={<UserOutlined />} style={{ backgroundColor: '#db2777' }} />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <Text strong style={{ fontSize: 13 }}>{rec.name || "-"}</Text>
                    <Text type="secondary" style={{ fontSize: 11 }}>{rec.email || "-"}</Text>
                </div>
            </Space>
        ),
    },
    {
        title: <ColHeader label="No. Telepon" tooltip="Nomor WhatsApp pelanggan." />,
        dataIndex: "phoneNumber",
        key: "phoneNumber",
        render: (v, rec) => v ? (
            <Space>
                <Text style={{ fontSize: 13 }}>{v}</Text>
                <a href={`https://wa.me/${v}`} target="_blank" rel="noreferrer">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WA" style={{ width: 16 }} />
                </a>
                <a
                    href={`https://mail.google.com/mail/?view=cm&fs=1&to=${rec.email}`}
                    target="_blank"
                    rel="noreferrer"
                >
                    <Button
                        type="text"
                        size="small"
                        icon={<MailOutlined style={{ color: '#db2777' }} />}
                        style={{ padding: 0 }}
                    />
                </a>
            </Space>
        ) : "-",
    },
    {
        title: <ColHeader label="Total Pesanan" tooltip="Jumlah pesanan yang sudah sukses." />,
        dataIndex: "total_orders",
        key: "total_orders",
        align: "center",
        sorter: true,
        render: (v) => <Tag color="blue" style={{ borderRadius: 20, fontWeight: 'bold' }}>{v}</Tag>,
    },
    {
        title: <ColHeader label="Total Belanja (LTV)" tooltip="Total nilai belanja pelanggan selama ini." />,
        dataIndex: "ltv",
        key: "ltv",
        align: "right",
        sorter: true,
        render: (v) => <Text strong style={{ color: '#b31f5f' }}>{new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(v)}</Text>,
    },
    {
        title: <ColHeader label="Segmen Loyalitas" tooltip="Klasifikasi pelanggan berdasarkan nilai belanja." />,
        key: "loyalty",
        align: "center",
        render: (_, rec) => {
            const ltv = rec.ltv || 0;
            let tag = LOYALTY_TAGS['NEW USER'];
            if (ltv >= 5000000) tag = LOYALTY_TAGS['BIG SPENDER'];
            else if (ltv >= 1000000) tag = LOYALTY_TAGS['LOYAL'];
            else if (ltv > 0) tag = LOYALTY_TAGS['CUSTOMER'];

            return <Tag color={tag.color} style={{ fontWeight: 'bold' }}>{tag.label}</Tag>;
        },
    },
    {
        title: <ColHeader label="Tanggal Bergabung" tooltip="Tanggal akun pelanggan pertama kali dibuat." />,
        dataIndex: "createdAt",
        key: "created_at",
        sorter: true,
        render: (v) => (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
                <Text style={{ fontSize: 13 }}>{moment(v).format("DD MMM YYYY")}</Text>
                <Text type="secondary" style={{ fontSize: 11 }}>{moment(v).fromNow()}</Text>
            </div>
        ),
    },
    {
        title: <ColHeader label="Status Verifikasi" tooltip="Status apakah email sudah dikonfirmasi." />,
        key: "status",
        align: "center",
        render: (_, rec) => (
            <Tag bordered={false} color={rec.emailVerified ? "success" : "warning"}>
                {rec.emailVerified ? "Terverifikasi" : "Belum Verifikasi"}
            </Tag>
        ),
    },
];

const TableSupabaseUser: React.FC = () => {
    const { token } = theme.useToken();
    const [searchParams, setSearchParams] = useSearchParams();
    const [data, setData] = useState<SupabaseUser[]>([]);
    const [summary, setSummary] = useState<UserSummary | null>(null);
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);

    const page = Number(searchParams.get("page")) || 1;
    const pageSize = Number(searchParams.get("per_page")) || 10;

    const fetchList = async () => {
        setLoading(true);
        try {
            const dateFrom = searchParams.get("date_from") || "";
            const dateTo = searchParams.get("date_to") || "";
            const minLtv = searchParams.get("min_ltv") || "";
            const minOrders = searchParams.get("min_orders") || "";
            const sortBy = searchParams.get("sort_by") || "created_at";
            const sortOrder = searchParams.get("sort_order") || "desc";
            const q = searchParams.get("q") || "";

            let queryStr = `q=${encodeURIComponent(q)}&page=${page}&per_page=${pageSize}&sort_by=${sortBy}&sort_order=${sortOrder}`;
            if (dateFrom) queryStr += `&date_from=${dateFrom}`;
            if (dateTo) queryStr += `&date_to=${dateTo}`;
            if (minLtv) queryStr += `&min_ltv=${minLtv}`;
            if (minOrders) queryStr += `&min_orders=${minOrders}`;

            const [listResp, summaryResp] = await Promise.all([
                http.get(`/admin/total-user-list?${queryStr}`),
                http.get(`/admin/total-user-summary?${queryStr}`)
            ]);

            const serve = listResp.data?.serve;
            if (serve) {
                setData(serve.data || []);
                setTotal(Number(serve.total || 0));
            }

            const summaryServe = summaryResp.data?.serve;
            if (summaryServe) {
                setSummary(summaryServe);
            }
        } catch (err) {
            message.error("Gagal mengambil data pelanggan terdaftar");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchList();
    }, [searchParams]);

    const handleTableChange: TableProps<SupabaseUser>["onChange"] = (p, _, s: any) => {
        setSearchParams((prev) => {
            prev.set("page", String(p.current));
            prev.set("per_page", String(p.pageSize));

            if (s && s.field) {
                const sortBy = s.field === "createdAt" ? "created_at" : s.field;
                prev.set("sort_by", sortBy);
                prev.set("sort_order", s.order === "ascend" ? "asc" : "desc");
            } else {
                prev.delete("sort_by");
                prev.delete("sort_order");
            }

            return prev;
        });
    };

    const handleFilterUpdate = (key: string, value: string | null) => {
        setSearchParams((prev) => {
            if (value) {
                prev.set(key, value);
            } else {
                prev.delete(key);
            }
            prev.set("page", "1");
            return prev;
        });
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            maximumFractionDigits: 0,
        }).format(val);
    };

    return (
        <Space direction="vertical" size="large" style={{ display: 'flex', width: '100%' }}>
            {/* Stat Cards Section */}
            <div
                style={{
                    display: "flex",
                    gap: 14,
                    marginBottom: 18,
                    flexWrap: "wrap",
                }}
            >
                {[
                    {
                        icon: <UserOutlined style={{ fontSize: 22, color: token.colorPrimary }} />,
                        label: "Total Pengguna Terdaftar",
                        value: summary?.total_users || 0,
                        bg: "linear-gradient(135deg, rgba(179,31,95,0.1), transparent)",
                        border: token.colorBorderSecondary,
                    },
                    {
                        icon: <LineChartOutlined style={{ fontSize: 22, color: "#52c41a" }} />,
                        label: "Total Pesanan Sukses",
                        value: summary?.total_success_transactions || 0,
                        bg: "linear-gradient(135deg, rgba(82,196,26,0.1), transparent)",
                        border: token.colorBorderSecondary,
                    },
                    {
                        icon: <DollarOutlined style={{ fontSize: 22, color: "#d46b08" }} />,
                        label: "Total Nilai Belanja (LTV)",
                        value: formatCurrency(summary?.total_revenue || 0),
                        bg: "linear-gradient(135deg, rgba(212,107,8,0.1), transparent)",
                        border: token.colorBorderSecondary,
                    },
                    {
                        icon: <ShoppingCartOutlined style={{ fontSize: 22, color: "#b45309" }} />,
                        label: "Rata-rata LTV per Pengguna",
                        value: formatCurrency(summary?.avg_ltv || 0),
                        bg: "linear-gradient(135deg, rgba(180,83,9,0.1), transparent)",
                        border: token.colorBorderSecondary,
                    },
                ].map((s, i) => (
                    <div
                        key={i}
                        style={{
                            flex: "1 1 160px",
                            minWidth: 200,
                            background: token.colorBgContainer,
                            backgroundImage: s.bg,
                            border: `1px solid ${s.border}`,
                            borderRadius: 14,
                            padding: "16px 20px",
                            display: "flex",
                            alignItems: "center",
                            gap: 14,
                            boxShadow: token.boxShadowTertiary,
                        }}
                    >
                        <div
                            style={{
                                width: 46,
                                height: 46,
                                borderRadius: 12,
                                background: 'transparent',
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                boxShadow: 'inset 1px 1px 4px rgba(255,255,255,0.8), 0 2px 8px rgba(0,0,0,0.05)',
                                border: '1px solid rgba(255,255,255,0.4)',
                                flexShrink: 0,
                            }}
                        >
                            {s.icon}
                        </div>
                        <div>
                            <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.2, color: token.colorText }}>
                                {s.value}
                            </div>
                            <div style={{ fontSize: 12, color: token.colorTextDescription, marginTop: 2 }}>
                                {s.label}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <Card style={{ borderRadius: 16 }} bodyStyle={{ padding: 24 }}>
                {/* Advanced Filters */}
                <div style={{ marginBottom: 20, padding: 16, background: token.colorFillAlter, borderRadius: 12 }}>
                    <Row gutter={[16, 16]} align="middle">
                        <Col xs={24} md={8}>
                            <Text strong style={{ display: 'block', marginBottom: 8, fontSize: 13 }}>Tanggal Bergabung</Text>
                            <RangePicker
                                style={{ width: '100%' }}
                                value={searchParams.get("date_from") && searchParams.get("date_to") ? [
                                    dayjs(searchParams.get("date_from")),
                                    dayjs(searchParams.get("date_to"))
                                ] : undefined}
                                onChange={(dates) => {
                                    setSearchParams((prev) => {
                                        if (dates && dates[0] && dates[1]) {
                                            prev.set("date_from", dates[0].format("YYYY-MM-DD"));
                                            prev.set("date_to", dates[1].format("YYYY-MM-DD"));
                                        } else {
                                            prev.delete("date_from");
                                            prev.delete("date_to");
                                        }
                                        prev.set("page", "1");
                                        return prev;
                                    });
                                }}
                            />
                        </Col>
                        <Col xs={12} md={5}>
                            <Text strong style={{ display: 'block', marginBottom: 8, fontSize: 13 }}>Minimum LTV (Rp)</Text>
                            <InputNumber
                                style={{ width: '100%' }}
                                placeholder="Misal: 1.000.000"
                                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
                                parser={(value) => value?.replace(/\$\s?|(\.*)/g, '') as unknown as number}
                                value={searchParams.get("min_ltv") ? Number(searchParams.get("min_ltv")) : null}
                                onChange={(val) => handleFilterUpdate("min_ltv", val ? String(val) : null)}
                            />
                        </Col>
                        <Col xs={12} md={5}>
                            <Text strong style={{ display: 'block', marginBottom: 8, fontSize: 13 }}>Minimum Pesanan</Text>
                            <InputNumber
                                style={{ width: '100%' }}
                                placeholder="Misal: 3"
                                value={searchParams.get("min_orders") ? Number(searchParams.get("min_orders")) : null}
                                onChange={(val) => handleFilterUpdate("min_orders", val ? String(val) : null)}
                            />
                        </Col>
                        <Col xs={24} md={6}>
                            <Text strong style={{ display: 'block', marginBottom: 8, fontSize: 13 }}>Cari</Text>
                            <Input.Search
                                placeholder="Cari nama/email/telepon..."
                                onSearch={(val) => handleFilterUpdate("q", val)}
                                enterButton="Cari"
                                style={{ width: '100%' }}
                                allowClear
                            />
                        </Col>
                    </Row>
                    <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                        <Button
                            icon={<ReloadOutlined />}
                            onClick={() => {
                                setSearchParams(new URLSearchParams());
                            }}
                        >
                            Reset Filter
                        </Button>
                    </div>
                </div>

                <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 13 }}>Tampilkan</span>
                        <Select
                            style={{ width: 80 }}
                            value={pageSize}
                            onChange={(val) => {
                                setSearchParams(prev => {
                                    prev.set("per_page", String(val));
                                    prev.set("page", "1");
                                    return prev;
                                });
                            }}
                        >
                            <Select.Option value={10}>10</Select.Option>
                            <Select.Option value={50}>50</Select.Option>
                            <Select.Option value={100}>100</Select.Option>
                        </Select>
                        <span style={{ fontSize: 13 }}>data</span>
                    </div>
                </div>

                <Table<SupabaseUser>
                    columns={columns}
                    rowKey="id"
                    dataSource={data}
                    loading={loading}
                    pagination={{
                        current: page,
                        pageSize: pageSize,
                        total: total,
                        showSizeChanger: false,
                        position: ["bottomRight"],
                    }}
                    onChange={handleTableChange}
                />
            </Card>
        </Space>
    );
};

export default TableSupabaseUser;
