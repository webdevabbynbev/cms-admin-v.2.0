import React, { useState, useEffect } from "react";
import { Select, Empty, message, Spin } from "antd";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import http from "../../api/http";
import dayjs from "dayjs";

interface TrafficData {
    date: string;
    total: number;
}

const TrafficChart: React.FC = () => {
    const [data, setData] = useState<TrafficData[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [days, setDays] = useState<number>(30);

    const fetchData = async (selectedDays: number) => {
        setLoading(true);
        try {
            const response = await http.get(`/admin/traffic-dashboard?days=${selectedDays}`);

            if (response?.data?.serve) {
                setData(response.data.serve);
            }
        } catch (error) {
            
            message.error("Failed to load traffic chart data");
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData(days);
    }, [days]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                <Select
                    value={days}
                    style={{ width: 170 }}
                    onChange={(v) => setDays(v)}
                    options={[
                        { value: 7, label: "7 Hari Terakhir" },
                        { value: 14, label: "14 Hari Terakhir" },
                        { value: 30, label: "30 Hari Terakhir" },
                    ]}
                />
            </div>
            <Spin spinning={loading}>
                <div style={{ flex: 1, minHeight: 400 }}>
                    {data && data.length > 0 ? (
                        <ResponsiveContainer width="100%" height={400}>
                            <BarChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis
                                    dataKey="date"
                                    tickFormatter={(v) => dayjs(v).format("DD MMM")}
                                    tick={{ fontSize: 12 }}
                                />
                                <YAxis tick={{ fontSize: 12 }} />
                                <Tooltip
                                    labelFormatter={(v) => dayjs(v).format("DD MMMM YYYY")}
                                    formatter={(v: any) => [`${v} Aktivitas`, "Total"]}
                                />
                                <Bar dataKey="total" fill="#faad14" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <Empty description="Belum ada data aktivitas" />
                    )}
                </div>
            </Spin>
        </div>
    );
};

export default TrafficChart;
