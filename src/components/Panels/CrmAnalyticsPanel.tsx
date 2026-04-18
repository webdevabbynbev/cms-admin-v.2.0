import { Card, Checkbox, Row, Col, Typography, Tooltip, theme, Grid } from "antd";
import { QuestionCircleOutlined } from "@ant-design/icons";

const { Text } = Typography;

interface CrmAnalyticsPanelProps {
    selectedMetrics: string[];
    onChange: (metrics: string[]) => void;
}

const groups = [
    {
        title: "Tingkat Kunjungan",
        options: [
            { label: "Jumlah Produk Dilihat", value: "jumlah_produk_dilihat" },
            { label: "Produk Unik Dilihat", value: "produk_unik_dilihat" },
            { label: "Produk Diklik", value: "produk_diklik" },
            { label: "Produk Unik Diklik", value: "produk_unik_diklik" },
            { label: "Pengunjung Produk", value: "pengunjung_produk" },
            { label: "Halaman Produk Dilihat", value: "halaman_produk_dilihat" },
            { label: "Klik Pencarian", value: "klik_pencarian" },
            { label: "Suka", value: "suka" },
        ],
    },
    {
        title: "Konversi",
        options: [
            { label: "Persentase Klik", value: "persentase_klik" },
            { label: "Tingkat Konversi Pesanan", value: "tingkat_konversi_pesanan" },
            { label: "Pengunjung Melihat Tanpa Membeli", value: "pengunjung_melihat_tanpa_membeli" },
            { label: "Tingkat Pengunjung Melihat Tanpa Membeli", value: "tingkat_pengunjung_melihat_tanpa_membeli" },
            { label: "Tingkat Konversi", value: "tingkat_konversi" },
            { label: "Total Pengunjung (Menambahkan Produk ke Keranjang)", value: "total_pengunjung_cart" },
            { label: "Dimasukkan ke Keranjang (Produk)", value: "produk_ke_keranjang" },
            { label: "Tingkat Konversi Produk Dimasukkan ke Keranjang", value: "tingkat_konversi_cart" },
        ],
    },
    {
        title: "Pesanan",
        options: [
            { label: "Penjualan", value: "penjualan" },
            { label: "Pesanan", value: "pesanan" },
            { label: "Produk", value: "produk" },
            { label: "Total Pembeli", value: "total_pembeli" },
            { label: "Penjualan per Pesanan", value: "penjualan_per_pesanan" },
        ],
    },
];

const CrmAnalyticsPanel: React.FC<CrmAnalyticsPanelProps> = ({ selectedMetrics, onChange }) => {
    const { token } = theme.useToken();
    const screens = Grid.useBreakpoint();
    const isMobile = !screens.md;
    const totalOptions = groups.reduce((acc, g) => acc + g.options.length, 0);

    return (
        <Card
            bodyStyle={{ padding: 0 }}
            style={{
                marginBottom: 20,
                borderRadius: 12,
                border: `1px solid ${token.colorBorderSecondary}`,
                boxShadow: token.boxShadowTertiary,
                overflow: "hidden",
                background: token.colorBgContainer,
            }}
        >
            <div style={{ padding: isMobile ? "18px 14px" : "28px 36px" }}>
                <Checkbox.Group
                    value={selectedMetrics}
                    onChange={(vals) => onChange(vals as string[])}
                    style={{ width: "100%" }}
                >
                    {groups.map((group, idx) => (
                        <div key={group.title}>
                            <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: "flex-start" }}>
                                <div style={{
                                    width: isMobile ? "100%" : 150,
                                    flexShrink: 0,
                                    paddingTop: 4,
                                    borderRight: isMobile ? "none" : `2px solid ${token.colorBorderSecondary}`,
                                    marginRight: isMobile ? 0 : 24,
                                    marginBottom: isMobile ? 10 : 0,
                                }}>
                                    <Text style={{
                                        fontSize: 12,
                                        color: token.colorTextDescription,
                                        fontWeight: 600,
                                        textTransform: "uppercase",
                                        letterSpacing: "0.5px"
                                    }}>
                                        {group.title}:
                                    </Text>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <Row gutter={[isMobile ? 8 : 24, 14]}>
                                        {group.options.map((opt) => (
                                            <Col xs={24} sm={12} md={6} key={opt.value}>
                                                <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
                                                    <Checkbox value={opt.value} style={{ paddingTop: 2 }}>
                                                        <span style={{
                                                            fontSize: 13,
                                                            color: token.colorText,
                                                            fontWeight: 400,
                                                            lineHeight: '1.6',
                                                            display: 'inline-block'
                                                        }}>
                                                            {opt.label}
                                                        </span>
                                                    </Checkbox>
                                                    <Tooltip title={`Info: ${opt.label}`}>
                                                        <QuestionCircleOutlined
                                                            style={{ fontSize: 12, color: token.colorTextQuaternary, cursor: "help", paddingTop: 6 }}
                                                        />
                                                    </Tooltip>
                                                </div>
                                            </Col>
                                        ))}
                                    </Row>
                                </div>
                            </div>
                            {idx !== groups.length - 1 && (
                                <div
                                    style={{
                                        height: 1,
                                        background: token.colorSplit,
                                        margin: isMobile ? "10px 0" : "14px 0",
                                    }}
                                />
                            )}
                        </div>
                    ))}
                </Checkbox.Group>
            </div>
            <div
                style={{
                    padding: isMobile ? "12px 14px" : "14px 36px",
                    background: token.colorFillAlter,
                    borderTop: `1px solid ${token.colorBorderSecondary}`,
                    display: "flex",
                    flexDirection: isMobile ? "column" : "row",
                    justifyContent: "space-between",
                    alignItems: isMobile ? "flex-start" : "center",
                    gap: isMobile ? 4 : 0,
                }}
            >
                <Text style={{ fontSize: 12, color: token.colorTextDescription }}>
                    Status Pemilihan Metrik
                </Text>
                <Text style={{ fontSize: 12, color: token.colorTextDescription }}>
                    Kriteria Dipilih: <Text strong style={{ color: token.colorPrimary }}>{selectedMetrics.length}</Text> /{" "}
                    <Text strong>{totalOptions}</Text>
                </Text>
            </div>
        </Card>
    );
};

export default CrmAnalyticsPanel;
