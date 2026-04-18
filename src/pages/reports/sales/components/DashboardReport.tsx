import React, { useState, useEffect } from "react";
import dayjs from "dayjs";
import { Typography, Spin, Row, Col, Progress, Table, Tag, message } from "antd";
import {
  DollarOutlined, ShoppingOutlined, UserOutlined, RiseOutlined,
  EyeOutlined, ArrowUpOutlined, ArrowDownOutlined, WalletOutlined,
  TagOutlined, SearchOutlined, ThunderboltOutlined, ClockCircleOutlined,
  PercentageOutlined, MobileOutlined, GlobalOutlined, TeamOutlined,
} from "@ant-design/icons";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar,
} from "recharts";
import {
  fetchDashboardSummary, fetchSeoTrafficOverview, fetchSeoTopPages,
  fetchSeoAudienceData, fetchSeoRealtimeData,
  type DashboardSummaryData, type SeoTopPage, type SeoAudienceData, type SeoRealtimeData,
} from "../../../../services/api/report.services";
import "./DashboardReport.css";

const { Text } = Typography;
const BLUE = "#1282a2";
const PINK = "#E85580";

interface DashboardReportProps { range: [any, any]; channel: string; }

const formatIDR = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
const fmt = (n: number) => new Intl.NumberFormat("id-ID").format(n);

// ── Unified glass card ──────────────────────────────────────
const GCard = ({ children, accent, style = {} }: any) => (
  <div className="glass-stat-card" style={{ borderLeft: `5px solid ${accent}`, ...style }}>
    {children}
  </div>
);

const SLabel = ({ children }: any) => <Text className="glass-stat-label">{children}</Text>;
const SValue = ({ children, style = {} }: any) => <div className="glass-stat-value" style={style}>{children}</div>;
const SSubtitle = ({ children }: any) => <Text className="glass-stat-sub">{children}</Text>;
const Growth = ({ v }: { v: number }) => (
  <div className={`glass-stat-growth ${v >= 0 ? "pos" : "neg"}`}>
    {v >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
    <span>{Math.abs(v).toFixed(1)}%</span>
    <span className="vs-text">vs bln lalu</span>
  </div>
);

// Horizontal bar — percent is already 0-100
const HBar = ({ label, percent, max = 100, color }: any) => (
  <div style={{ marginBottom: 10 }}>
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
      <Text style={{ fontSize: 12, fontWeight: 600 }}>{label}</Text>
      <Text style={{ fontSize: 12, fontWeight: 800, color }}>{percent}%</Text>
    </div>
    <Progress percent={Math.round((percent / max) * 100)} showInfo={false}
      strokeColor={color} trailColor="rgba(0,0,0,0.06)" strokeWidth={7} />
  </div>
);

// ── Main component ──────────────────────────────────────────
export const DashboardReport: React.FC<DashboardReportProps> = ({ range, channel }) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<DashboardSummaryData | null>(null);
  const [seoTraffic, setSeoTraffic] = useState<any>(null);
  const [seoPages, setSeoPages] = useState<SeoTopPage[]>([]);
  const [audience, setAudience] = useState<SeoAudienceData | null>(null);
  const [realtime, setRealtime] = useState<SeoRealtimeData | null>(null);

  const loadRealtime = async () => {
    try {
      const live = await fetchSeoRealtimeData();
      setRealtime(live);
    } catch { /* Silent error for realtime polling */ }
  };

  const loadAll = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const params = { start_date: range[0].format("YYYY-MM-DD"), end_date: range[1].format("YYYY-MM-DD") };
      const [a, b, c, d] = await Promise.allSettled([
        fetchDashboardSummary({ start_date: range[0].toISOString(), end_date: range[1].toISOString(), channel: channel as any }),
        fetchSeoTrafficOverview(params),
        fetchSeoTopPages(params),
        fetchSeoAudienceData(params),
      ]);
      if (a.status === "fulfilled") setData(a.value);
      else if (!silent) message.error("Gagal memuat data dashboard");
      if (b.status === "fulfilled") setSeoTraffic(b.value);
      if (c.status === "fulfilled") setSeoPages(c.value);
      if (d.status === "fulfilled") setAudience(d.value);
    } catch { if (!silent) message.error("Gagal memuat data"); }
    finally { if (!silent) setLoading(false); }
  };

  useEffect(() => {
    if (range[0] && range[1]) {
      loadAll();
      loadRealtime();
      const t = setInterval(() => loadAll(true), 60000);
      const rt = setInterval(loadRealtime, 20000); // Poll realtime every 20s
      return () => { clearInterval(t); clearInterval(rt); };
    }
  }, [range, channel]);

  if (loading && !data) return (
    <div style={{ padding: 80, textAlign: "center" }}><Spin tip="Memuat Dashboard..." size="large" /></div>
  );
  if (!data) return null;

  const { summary: s, trend } = data;
  const convPct = Math.min((s.conversion_rate / 10) * 100, 100);

  const devColors = [BLUE, PINK, "#8b5cf6"];
  const ageColors = [BLUE, PINK, "#10b981", "#94a3b8"];

  return (
    <div className="dash-container">

      {/* ══ 0. Realtime "Live Now" Section ══════════════════════ */}
      {realtime && (
        <div style={{ marginBottom: 28 }}>
          <div className="section-label">LIVE ACTIVITY (30 MIN TERAKHIR)</div>
          <GCard accent="#10b981" style={{ padding: "16px 20px" }}>
            <Row gutter={[24, 24]} align="middle">
              <Col xs={24} md={8}>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                    <div className="realtime-dot" />
                    <Text className="realtime-text">PENGUNJUNG LIVE</Text>
                  </div>
                  <div className="realtime-value">{realtime.activeUsers}</div>
                  <Text style={{ fontSize: 12, color: "#64748b", marginTop: 8 }}>Pengguna aktif di situs saat ini</Text>
                </div>
              </Col>
              
              <Col xs={24} md={10}>
                <Text style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", display: "block", marginBottom: 12 }}>AKTIVITAS PER MENIT</Text>
                  <div style={{ width: "100%", height: 80 }}>
                    <ResponsiveContainer>
                      <BarChart data={realtime.minutes} margin={{ left: 35, right: 25, bottom: 0 }}>
                        <XAxis 
                          dataKey="minute" 
                          reversed 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 9, fill: "#94a3b8" }}
                          tickFormatter={(v) => v === 0 ? "Sekarang" : v === 29 ? "30m lalu" : ""}
                          interval={0}
                        />
                        <ChartTooltip 
                          cursor={{ fill: "rgba(16, 185, 129, 0.05)" }}
                          contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", fontSize: "11px" }}
                          formatter={(value: any) => [value, "Pengguna"]}
                          labelFormatter={(label: any) => label === 0 ? "Sekarang" : `${label} menit lalu`}
                        />
                        <Bar dataKey="users" fill="#10b981" radius={[2, 2, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
              </Col>

              <Col xs={24} md={6}>
                <Text style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", display: "block", marginBottom: 10 }}>LOKASI TERAKTIF</Text>
                {realtime.cities.map((c, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <Text style={{ fontSize: 12, fontWeight: 600 }}>{c.city}</Text>
                    <Text style={{ fontSize: 12, fontWeight: 800, color: "#10b981" }}>{c.activeUsers}</Text>
                  </div>
                ))}
              </Col>
            </Row>
          </GCard>
        </div>
      )}

      {/* ══ 1. Main 2×3 Stat Grid ══════════════════════════════ */}
      <div className="section-label">RINGKASAN UTAMA</div>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {[
          { title: "Total Penjualan", value: formatIDR(s.total_sales), icon: <DollarOutlined />, accent: BLUE, growth: s.growth.sales },
          { title: "Total Pesanan", value: fmt(s.total_orders), icon: <ShoppingOutlined />, accent: PINK, growth: s.growth.orders },
          { title: "Produk Terjual", value: fmt(s.products_sold), icon: <RiseOutlined />, accent: BLUE, growth: 15.3 },
          { title: "Total Pengunjung", value: fmt(s.total_visitors), icon: <EyeOutlined />, accent: PINK, growth: 11.2 },
          { title: "Total Pembeli", value: fmt(s.total_buyers), icon: <UserOutlined />, accent: BLUE, growth: 6.7 },
        ].map((c) => (
          <Col xs={24} sm={12} md={8} key={c.title}>
            <GCard accent={c.accent}>
              <div className="glass-stat-header"><span style={{ color: c.accent, fontSize: 16 }}>{c.icon}</span><SLabel>{c.title}</SLabel></div>
              <SValue>{c.value}</SValue>
              <Growth v={c.growth} />
            </GCard>
          </Col>
        ))}
        {/* Produk Diklik */}
        <Col xs={24} sm={12} md={8}>
          <GCard accent={PINK}>
            <div className="glass-stat-header">
              <SearchOutlined style={{ color: PINK, fontSize: 16 }} />
              <SLabel>Produk Diklik</SLabel>
              {realtime && <Tag color="error" style={{ fontSize: 9, height: 16, lineHeight: "14px", marginLeft: 8, borderRadius: 4, border: "none", fontWeight: 800 }}>LIVE</Tag>}
            </div>
            <SValue>{fmt(realtime?.productClicks ?? (seoTraffic?.product_clicks || 0))}</SValue>
            <SSubtitle>{realtime ? "Aktivitas 30 menit terakhir" : "Klik dari product listing"}</SSubtitle>
            <span className="top-product-badge" style={{ marginTop: 8, display: "inline-block" }}>
              Top: {realtime?.topProduct ?? (seoTraffic?.top_product || "-")}
            </span>
          </GCard>
        </Col>
      </Row>

      {/* ══ 2. Conversion Rate (compact) ═══════════════════════ */}
      <GCard accent={BLUE} style={{ marginBottom: 24, height: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div className="glass-stat-header" style={{ marginBottom: 0 }}>
            <PercentageOutlined style={{ color: BLUE, fontSize: 16 }} />
            <SLabel>TINGKAT KONVERSI</SLabel>
          </div>
          <Text style={{ fontWeight: 900, fontSize: 20, color: BLUE }}>{s.conversion_rate.toFixed(2)}%</Text>
        </div>
        <div style={{ marginTop: 12 }}>
          <Progress percent={convPct} showInfo={false} strokeColor={BLUE} trailColor="rgba(0,0,0,0.06)" strokeWidth={9} />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
            {["0%", "Target ~3%", "10%"].map(l => <Text key={l} style={{ fontSize: 10, fontWeight: 600, color: "#94a3b8" }}>{l}</Text>)}
          </div>
        </div>
      </GCard>

      {/* ══ 3. Mini Metric Cards ════════════════════════════════ */}
      <Row gutter={[14, 14]} style={{ marginBottom: 28 }}>
        {[
          { label: "AOV - Avg Order Value", value: formatIDR(s.aov), icon: <WalletOutlined />, accent: BLUE },
          { label: "ASP - Avg Selling Price", value: formatIDR(s.asp), icon: <TagOutlined />, accent: PINK },
          { label: "Produk / Pesanan", value: (s.products_sold / (s.total_orders || 1)).toFixed(1), icon: <ShoppingOutlined />, accent: BLUE },
        ].map(c => (
          <Col xs={12} sm={6} key={c.label}>
            <div className="glass-mini-card">
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <span style={{ color: c.accent, fontSize: 16 }}>{c.icon}</span>
                <Text className="glass-stat-label">{c.label}</Text>
              </div>
              <div className="glass-mini-value">{c.value}</div>
            </div>
          </Col>
        ))}
        <Col xs={12} sm={6}>
          <div className="glass-mini-card" style={{ borderColor: "rgba(16,185,129,0.2)", background: "rgba(16,185,129,0.06)" }}>
            <Text className="glass-stat-label">Status Data</Text>
            <div style={{ fontWeight: 800, fontSize: 14, color: "#10b981", marginTop: 6 }}>● Live & Dynamic</div>
          </div>
        </Col>
      </Row>

      {/* ══ 4. Sales Trend Chart ════════════════════════════════ */}
      <div className="section-label">TREN PENJUALAN & PESANAN</div>
      <GCard accent={BLUE} style={{ marginBottom: 28, padding: "18px 20px 8px", height: "auto" }}>
        <div style={{ width: "100%", height: 270 }}>
          <ResponsiveContainer>
            <AreaChart data={trend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gradS" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={BLUE} stopOpacity={0.28} />
                  <stop offset="95%" stopColor={BLUE} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }}
                tickFormatter={(v) => dayjs(v).format("D MMM")} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }}
                tickFormatter={(v) => v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
              <ChartTooltip contentStyle={{ borderRadius: 14, border: "none", boxShadow: "0 10px 40px rgba(0,0,0,0.12)", background: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)" }}
                formatter={(val: any, name: any) => [name === "Penjualan" ? formatIDR(val) : val, name]} />
              <Area type="monotone" dataKey="sales" stroke={BLUE} strokeWidth={3.5} fillOpacity={1} fill="url(#gradS)" name="Penjualan" activeDot={{ r: 6, strokeWidth: 0 }} />
              <Area type="monotone" dataKey="orders" stroke={PINK} strokeWidth={2.5} fill="transparent" name="Pesanan" strokeDasharray="5 4" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </GCard>

      {/* ══ 5. Traffic Overview — BELOW the chart ═══════════════ */}
      {seoTraffic && (
        <>
          <div className="section-label"><EyeOutlined style={{ marginRight: 6 }} />TRAFFIC OVERVIEW</div>
          <Row gutter={[14, 14]} style={{ marginBottom: 28 }}>
            {[
              { title: "Total Views", value: fmt(seoTraffic.total_views), growth: seoTraffic.growth?.views, icon: <EyeOutlined />, accent: BLUE },
              { title: "Impressions", value: fmt(seoTraffic.impressions), sub: "Tampil di hasil pencarian", growth: seoTraffic.growth?.impressions, icon: <SearchOutlined />, accent: PINK },
              { title: "Sessions", value: fmt(seoTraffic.sessions), growth: seoTraffic.growth?.sessions, icon: <RiseOutlined />, accent: BLUE },
            ].map(c => (
              <Col xs={24} sm={8} key={c.title}>
                <GCard accent={c.accent}>
                  <div className="glass-stat-header"><span style={{ color: c.accent, fontSize: 16 }}>{c.icon}</span><SLabel>{c.title}</SLabel></div>
                  <SValue>{c.value}</SValue>
                  {(c as any).sub && <SSubtitle>{(c as any).sub}</SSubtitle>}
                  <div className="glass-stat-growth pos"><ArrowUpOutlined /><span>{c.growth}%</span></div>
                </GCard>
              </Col>
            ))}
            {/* Users */}
            <Col xs={24} sm={12} md={6}>
              <GCard accent={BLUE}>
                <div className="glass-stat-header"><TeamOutlined style={{ color: BLUE, fontSize: 16 }} /><SLabel>Users</SLabel></div>
                {[["Total", seoTraffic.total_users, BLUE], ["Active", seoTraffic.active_users, "#10b981"], ["New", seoTraffic.new_users, PINK]].map(([k, v, c]) => (
                  <div key={k as string} style={{ display: "flex", justifyContent: "space-between", marginTop: 5 }}>
                    <Text style={{ fontSize: 12, color: "#64748b" }}>{k}</Text>
                    <Text style={{ fontWeight: 800, fontSize: 13, color: c as string }}>{fmt(v as number)}</Text>
                  </div>
                ))}
              </GCard>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <GCard accent={PINK}>
                <div className="glass-stat-header"><ThunderboltOutlined style={{ color: PINK, fontSize: 16 }} /><SLabel>Total Events</SLabel></div>
                <SValue>{fmt(seoTraffic.total_events)}</SValue>
                <SSubtitle>Klik, scroll, form submit</SSubtitle>
                <div className="glass-stat-growth pos"><ArrowUpOutlined /><span>22.1%</span></div>
              </GCard>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <GCard accent={BLUE}>
                <div className="glass-stat-header"><ClockCircleOutlined style={{ color: BLUE, fontSize: 16 }} /><SLabel>Avg. Session Duration</SLabel></div>
                <SValue>{seoTraffic.avg_session_duration}</SValue>
                <div className="glass-stat-growth pos"><ArrowUpOutlined /><span>28 dtk vs sebelumnya</span></div>
              </GCard>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <GCard accent={PINK}>
                <div className="glass-stat-header"><span style={{ color: PINK, fontWeight: 900, fontSize: 15 }}>↩</span><SLabel>Bounce Rate</SLabel></div>
                <SValue>{seoTraffic.bounce_rate}%</SValue>
                <div className="glass-stat-growth neg"><ArrowUpOutlined /><span>2.1% (lebih tinggi)</span></div>
              </GCard>
            </Col>
          </Row>
        </>
      )}

      {/* ══ 6. SEO Performance — Top Pages ══════════════════════ */}
      {seoPages.length > 0 && (
        <>
          <div className="section-label"><SearchOutlined style={{ marginRight: 6 }} />SEO PERFORMANCE — Top Pages by Views</div>
          <div className="glass-stat-card" style={{ marginBottom: 28, padding: 0, overflow: "hidden", borderLeft: `5px solid ${BLUE}`, height: "auto" }}>
            <Table
              dataSource={seoPages.map((p, i) => ({ ...p, key: i }))}
              columns={[
                { title: "#", width: 36, render: (_: any, __: any, i: number) => <Text style={{ fontWeight: 700, color: "#94a3b8", fontSize: 12 }}>{i + 1}</Text> },
                {
                  title: "HALAMAN", dataIndex: "page",
                  render: (page: string) => (
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>
                        {page.split("/").filter(Boolean).pop()?.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()) || page}
                      </div>
                      <Text style={{ fontSize: 11, color: BLUE }}>{page}</Text>
                    </div>
                  ),
                },
                { title: "VIEWS", dataIndex: "clicks", width: 90, align: "right" as const, render: (v: number) => <Text style={{ fontWeight: 800, fontSize: 14 }}>{fmt(v)}</Text> },
                { title: "TREN", dataIndex: "trend", width: 76, align: "center" as const, render: (v: number) => <Tag color={v >= 0 ? "green" : "red"} style={{ fontWeight: 700, borderRadius: 8, fontSize: 11 }}>{v >= 0 ? "+" : ""}{v}%</Tag> },
              ]}
              pagination={false} size="small" rowClassName="seo-row"
            />
          </div>
        </>
      )}

      {/* ══ 7. Audience & Traffic Breakdown ═════════════════════ */}
      {audience && (
        <>
          <div className="section-label"><GlobalOutlined style={{ marginRight: 6 }} />AUDIENCE & TRAFFIC BREAKDOWN</div>

          {/* Row 1: Device | City | Traffic Source — equal 1/3 columns */}
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }} align="stretch">
            <Col xs={24} md={8}>
              <GCard accent={BLUE} style={{ height: "100%" }}>
                <div className="glass-stat-header"><MobileOutlined style={{ color: BLUE, fontSize: 16 }} /><SLabel>Device</SLabel></div>
                <div style={{ marginTop: 12 }}>
                  {(() => { const mx = Math.max(...audience.device.map(d => d.percent)); return audience.device.map((d, i) => <HBar key={d.category} label={d.category} percent={d.percent} max={mx} color={devColors[i] || "#94a3b8"} />); })()}
                </div>
              </GCard>
            </Col>
            <Col xs={24} md={8}>
              <GCard accent={PINK} style={{ height: "100%" }}>
                <div className="glass-stat-header"><GlobalOutlined style={{ color: PINK, fontSize: 16 }} /><SLabel>Traffic by City</SLabel></div>
                <div style={{ marginTop: 12 }}>
                  {(() => { const mx = Math.max(...audience.city.map(c => c.percent)); return audience.city.map((c, i) => <HBar key={c.city} label={c.city} percent={c.percent} max={mx} color={i % 2 === 0 ? BLUE : PINK} />); })()}
                </div>
              </GCard>
            </Col>
            <Col xs={24} md={8}>
              <GCard accent={BLUE} style={{ height: "100%", display: "flex", flexDirection: "column" }}>
                <div className="glass-stat-header"><span style={{ color: BLUE, fontSize: 16 }}>◑</span><SLabel>Traffic Source</SLabel></div>
                <div style={{ display: "flex", justifyContent: "center", flex: 1, alignItems: "center" }}>
                  <PieChart width={170} height={170}>
                    <Pie data={audience.traffic_source} dataKey="value" cx="50%" cy="50%"
                      innerRadius={50} outerRadius={75} paddingAngle={3} strokeWidth={0}>
                      {audience.traffic_source.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <ChartTooltip formatter={(v: any, n: any) => [`${v}%`, n]} />
                  </PieChart>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "3px 10px", justifyContent: "center", marginTop: 4 }}>
                  {audience.traffic_source.map(s => (
                    <div key={s.name} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <div style={{ width: 7, height: 7, borderRadius: "50%", background: s.color }} />
                      <Text style={{ fontSize: 10, color: "#64748b" }}>{s.name} {s.value}%</Text>
                    </div>
                  ))}
                </div>
              </GCard>
            </Col>
          </Row>

          {/* Row 2: Age Distribution | Gender */}
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }} align="stretch">
            <Col xs={24} md={14}>
              <GCard accent={PINK} style={{ height: "100%" }}>
                <div className="glass-stat-header"><TeamOutlined style={{ color: PINK, fontSize: 16 }} /><SLabel>Age Distribution</SLabel></div>
                <div style={{ marginTop: 12 }}>
                  {(() => { const mx = Math.max(...audience.age.map(a => a.percent)); return audience.age.map((a, i) => <HBar key={a.range} label={a.range} percent={a.percent} max={mx} color={ageColors[i] || "#94a3b8"} />); })()}
                </div>
              </GCard>
            </Col>
            <Col xs={24} md={10}>
              <GCard accent={BLUE} style={{ height: "100%" }}>
                <div className="glass-stat-header"><UserOutlined style={{ color: BLUE, fontSize: 16 }} /><SLabel>Gender</SLabel></div>
                <div style={{ display: "flex", justifyContent: "center", marginTop: 4 }}>
                  <PieChart width={145} height={145}>
                    <Pie data={audience.gender} dataKey="percent" cx="50%" cy="50%"
                      innerRadius={42} outerRadius={65} paddingAngle={3} strokeWidth={0}>
                      {audience.gender.map((g, i) => <Cell key={i} fill={g.color} />)}
                    </Pie>
                    <ChartTooltip formatter={(v: any, n: any) => [`${v}%`, n]} />
                  </PieChart>
                </div>
                <div style={{ marginTop: 10 }}>
                  {audience.gender.map(g => (
                    <div key={g.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 10, height: 10, borderRadius: 3, background: g.color }} />
                        <Text style={{ fontSize: 13, fontWeight: 600 }}>{g.label}</Text>
                      </div>
                      <Text style={{ fontWeight: 900, fontSize: 14, color: g.color }}>{g.percent}%</Text>
                    </div>
                  ))}
                </div>
              </GCard>
            </Col>
          </Row>

          {/* Row 3: Traffic by Time of Day */}
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 10 }}>
            <div className="section-label" style={{ marginBottom: 0 }}>Traffic by Time of Day</div>
            <Text style={{ fontSize: 11, color: "#94a3b8" }}>Jam aktif pengunjung — rata-rata per hari</Text>
          </div>
          <GCard accent={BLUE} style={{ marginBottom: 28, padding: "16px 20px 8px", height: "auto" }}>
            <div style={{ width: "100%", height: 210 }}>
              <ResponsiveContainer>
                <BarChart data={audience.hourly} margin={{ top: 4, right: 8, left: -10, bottom: 0 }} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.04)" />
                  <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8" }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8" }} />
                  <ChartTooltip
                    contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 8px 30px rgba(0,0,0,0.1)", background: "rgba(255,255,255,0.95)", backdropFilter: "blur(10px)" }}
                    formatter={(v: any) => [v, "Sessions"]}
                  />
                  <Bar dataKey="sessions" name="Sessions" radius={[5, 5, 0, 0]}>
                    {audience.hourly.map((entry, i) => (
                      <Cell key={i}
                        fill={entry.sessions >= 250 ? BLUE : entry.sessions >= 150 ? `rgba(18,130,162,0.6)` : "rgba(18,130,162,0.22)"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GCard>
        </>
      )}
    </div>
  );
};
