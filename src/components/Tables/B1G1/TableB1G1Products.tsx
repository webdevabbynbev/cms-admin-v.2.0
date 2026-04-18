import React, { useEffect, useState } from "react";
import {
    Table,
    Button,
    Card,
    Input,
    Tag,
    message,
    Image,
    Typography,
    Grid,
} from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import http from "../../../api/http";

const { Paragraph } = Typography;

const TableB1G1Products: React.FC = () => {
    const screens = Grid.useBreakpoint();
    const isMobile = !screens.md;
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState("");

    const fetchData = async () => {
        try {
            setLoading(true);
            const response = await http.get("/admin/buy-one-get-one/variants-for-selector?limit=1000");
            const body = response?.data;
            // Backend returns: { data: { serve: [...] }, serve: { data: [...] } }
            const rawData =
                body?.data?.serve ||
                body?.serve?.data ||
                body?.serve ||
                body?.data ||
                [];
            const items = Array.isArray(rawData) ? rawData : [];
            setData(items);
        } catch (error) {
            
            message.error("Gagal memuat data produk");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const filteredData = data.filter((item: any) => {
        const name = (item.name || item.label || "").toLowerCase();
        const sku = (item.sku || "").toLowerCase();
        const s = searchText.toLowerCase();
        return name.includes(s) || sku.includes(s);
    });

    const columns = [
        {
            title: "Gambar",
            key: "image",
            width: 80,
            render: (_: any, record: any) => (
                record.image_url ? (
                    <Image
                        src={record.image_url}
                        alt={record.name}
                        width={50}
                        height={50}
                        style={{ objectFit: 'cover', borderRadius: 4 }}
                    />
                ) : (
                    <div style={{ width: 50, height: 50, background: '#f0f0f0', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#999' }}>
                        No Image
                    </div>
                )
            ),
        },
        {
            title: "SKU",
            dataIndex: "sku",
            key: "sku",
            width: 150,
            render: (text: string) => <Typography.Text strong>{text}</Typography.Text>
        },
        {
            title: "Nama Produk Variant",
            key: "name",
            width: 250,
            render: (_: any, record: any) => (
                <div>
                    <div style={{ fontWeight: 500 }}>{record.name || record.label || "-"}</div>
                </div>
            ),
        },
        {
            title: "Deskripsi",
            dataIndex: "description",
            key: "description",
            render: (text: string) => (
                <Paragraph ellipsis={{ rows: 2, expandable: true, symbol: 'more' }} style={{ marginBottom: 0, fontSize: '0.9em', color: '#666' }}>
                    {text || "-"}
                </Paragraph>
            )
        },
        {
            title: "Harga",
            dataIndex: "price",
            key: "price",
            width: 120,
            align: "right" as const,
            render: (val: number) => `Rp ${(val || 0).toLocaleString("id-ID")}`,
        },
        {
            title: "Stok",
            dataIndex: "stock",
            key: "stock",
            width: 80,
            align: "center" as const,
            render: (val: number) => (
                <Tag color={val > 0 ? "green" : "red"}>
                    {val ?? 0}
                </Tag>
            ),
        },
    ];

    return (
        <Card
            title={
                <div style={{ whiteSpace: "normal", lineHeight: 1.3 }}>
                    Master B1G1 Candidates (Pool Produk)
                </div>
            }
            extra={!isMobile ? (
                <Button icon={<ReloadOutlined />} onClick={fetchData}>
                    Refresh
                </Button>
            ) : undefined}
        >
            {isMobile && (
                <div style={{ marginBottom: 12 }}>
                    <Button icon={<ReloadOutlined />} onClick={fetchData}>
                        Refresh
                    </Button>
                </div>
            )}
            <div style={{ marginBottom: 16 }}>
                <Input.Search
                    placeholder="Cari variant berdasarkan nama atau SKU..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    allowClear
                    size="large"
                />
            </div>
            <div className="overflow-x-auto md:overflow-visible">
                <Table
                    columns={columns}
                    dataSource={filteredData}
                    loading={loading}
                    pagination={{ pageSize: 10, showSizeChanger: true, pageSizeOptions: ['10', '20', '50'] }}
                    rowKey="value"
                    scroll={{ x: "max-content" }}
                />
            </div>
        </Card>
    );
};

export default TableB1G1Products;
