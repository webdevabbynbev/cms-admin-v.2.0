import React, { useState, useCallback, useEffect } from "react";
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
import { theme } from "antd";
import http from "../../api/http";

interface TransactionData {
  Date: string;
  Total: number;
}

type PeriodType = "daily" | "monthly";

const TransactionChart: React.FC = () => {
  const { token } = theme.useToken();
  const [data, setData] = useState<TransactionData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [period, setPeriod] = useState<PeriodType>("daily");

  const fetchData = useCallback(async (selectedPeriod: PeriodType) => {
    setLoading(true);
    try {
      const response = await http.get("/admin/total-transaction-period");
      if (response?.data?.serve) {
        const chartData: TransactionData[] = response.data.serve[selectedPeriod].map(
          (item: any) => ({
            Date:
              selectedPeriod === "daily"
                ? item.date.split("-")[2]
                : item.monthName,
            Total: item.total,
          })
        );
        setData(chartData);
      }
    } catch (error) {
      
      message.error("Failed to load transaction chart data");
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(period);
  }, [fetchData, period]);

  const handlePeriodChange = (value: PeriodType) => {
    setPeriod(value);
    fetchData(value);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <Select<PeriodType>
          value={period}
          style={{ width: 220 }}
          onChange={handlePeriodChange}
          options={[
            { value: "daily", label: "Daily (Current Month)" },
            { value: "monthly", label: "Monthly (Current Year)" },
          ]}
        />
      </div>
      <Spin spinning={loading}>
        <div style={{ flex: 1, minHeight: 400 }}>
          {data && data.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="Date"
                  stroke={token.colorTextDescription}
                  tick={{ fill: token.colorTextDescription, fontSize: 12 }}
                  label={{
                    value: period === "daily" ? "Date" : "Month",
                    position: "insideBottom",
                    offset: -3,
                    fill: token.colorTextDescription
                  }}
                />
                <YAxis
                  stroke={token.colorTextDescription}
                  tick={{ fill: token.colorTextDescription, fontSize: 12 }}
                  label={{
                    value: "Total Transactions",
                    angle: -90,
                    position: "insideLeft",
                    fill: token.colorTextDescription
                  }}
                />
                <Tooltip />
                <Bar dataKey="Total" fill="#1890ff" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <Empty description="No transaction data available" />
          )}
        </div>
      </Spin>
    </div>
  );
};

export default TransactionChart;
