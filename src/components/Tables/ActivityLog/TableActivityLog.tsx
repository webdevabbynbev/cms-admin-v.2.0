import React from "react";
import {
  Table,
  Button,
  Input,
  Card,
  Select,
  Modal,
  Col,
  Row,
  Space,
  Tooltip,
  Grid,
} from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { useSearchParams } from "react-router-dom";
import http from "../../../api/http";

type ActivityLogRecord = {
  id: number | string;
  roleName: string;
  userName: string;
  activity: string;
  data_array?: Record<string, any>;
};

type ServePayload = {
  currentPage: string | number;
  perPage: string | number;
  total: string | number;
  data: ActivityLogRecord[];
};

type ListResponse = {
  data?: {
    serve: ServePayload;
  };
};

type ColumnsCtx = {
  setCurrent: (rec: ActivityLogRecord | false) => void;
};

const columns = (props: ColumnsCtx): ColumnsType<ActivityLogRecord> => [
  {
    title: "Role Name",
    dataIndex: "roleName",
  },
  {
    title: "Name",
    dataIndex: "userName",
  },
  {
    title: "Activity",
    dataIndex: "activity",
  },
  {
    title: "#",
    width: "10%",
    align: "center",
    dataIndex: "action",
    render: (_: unknown, record: ActivityLogRecord) => (
      <Tooltip title="View Activity Details">
        <Button
          key="/detail"
          icon={<InfoCircleOutlined />}
          onClick={() => {
            props.setCurrent(record);
          }}
        />
      </Tooltip>
    ),
  },
];

const TableActivityLog: React.FC = () => {
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = React.useState<ActivityLogRecord[]>([]);

  // Derived from URL
  const page = Number(searchParams.get("page")) || 1;
  const pageSize = Number(searchParams.get("per_page")) || 10;
  const searchName = searchParams.get("q") || "";

  const [current, setCurrent] = React.useState<ActivityLogRecord | false>(
    false,
  );
  const [loading, setLoading] = React.useState<boolean>(false);
  const [total, setTotal] = React.useState(0);
  const { Search } = Input;

  const fetchList = React.useCallback(async () => {
    setLoading(true);
    try {
      const resp = (await http.get(
        `/admin/activity-logs?q=${searchName}&page=${page}&per_page=${pageSize}`,
      )) as ListResponse;

      const serve = resp?.data?.serve;
      if (serve) {
        setData(serve.data || []);
        setTotal(Number(serve.total));
      }
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, searchName]);

  React.useEffect(() => {
    fetchList();
  }, [fetchList]);

  return (
    <>
      <Card style={{ marginTop: 10 }}>
        {isMobile ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-start" }}>
            <div className="flex align-center">
              <span style={{ fontSize: 12 }}>Show</span>
              <Select<number>
                style={{ width: 80, marginLeft: 10, marginRight: 10 }}
                value={pageSize}
                onChange={(pageSize) => {
                  setSearchParams((prev) => {
                    prev.set("per_page", String(pageSize));
                    prev.set("page", "1");
                    return prev;
                  });
                }}
                options={[
                  { value: 10, label: "10" },
                  { value: 50, label: "50" },
                  { value: 100, label: "100" },
                  { value: 500, label: "500" },
                ]}
              />
              <span style={{ fontSize: 12 }}>entries</span>
            </div>

            <Search
              placeholder="Search activity"
              defaultValue={searchName}
              onSearch={(val) => {
                setSearchParams((prev) => {
                  if (val.trim()) prev.set("q", val.trim());
                  else prev.delete("q");
                  prev.set("page", "1");
                  return prev;
                });
              }}
              allowClear
              style={{ width: "100%" }}
            />
          </div>
        ) : (
          <div
            className="flex flex-wrap"
            style={{ width: "100%", alignItems: "flex-end" }}
          >
            <div className="flex align-center">
              <span style={{ fontSize: 12 }}>Show</span>
              <Select<number>
                style={{ width: 80, marginLeft: 10, marginRight: 10 }}
                value={pageSize}
                onChange={(pageSize) => {
                  setSearchParams((prev) => {
                    prev.set("per_page", String(pageSize));
                    prev.set("page", "1");
                    return prev;
                  });
                }}
                options={[
                  { value: 10, label: "10" },
                  { value: 50, label: "50" },
                  { value: 100, label: "100" },
                  { value: 500, label: "500" },
                ]}
              />
              <span style={{ fontSize: 12 }}>entries</span>
            </div>

            <Space style={{ marginLeft: "auto" }}>
              <Search
                placeholder="Search activity"
                defaultValue={searchName}
                onSearch={(val) => {
                  setSearchParams((prev) => {
                    if (val.trim()) prev.set("q", val.trim());
                    else prev.delete("q");
                    prev.set("page", "1");
                    return prev;
                  });
                }}
                allowClear
                style={{ width: 250 }}
              />
            </Space>
          </div>
        )}
      </Card>

      <div className="overflow-x-auto md:overflow-visible">
        <Table<ActivityLogRecord>
          style={{ marginTop: 10 }}
          columns={columns({
            setCurrent: (v) => setCurrent(v),
          })}
          rowKey={(record) => String(record.id)}
          dataSource={data}
          pagination={{
            current: page,
            pageSize: pageSize,
            total,
          }}
          loading={loading}
          onChange={(p) => {
            setSearchParams((prev) => {
              prev.set("page", String(p.current));
              prev.set("per_page", String(p.pageSize));
              return prev;
            });
          }}
          scroll={{ x: "max-content" }}
        />
      </div>

      <Modal
        centered
        open={!!current}
        title="Detail Activity Log"
        onCancel={() => setCurrent(false)}
        footer={null}
        width={600}
      >
        {current && (
          <>
            <Row>
              <Col span={8} style={{ fontWeight: "bold" }}>
                Role Name
              </Col>
              <Col span={1}>:</Col>
              <Col span={15}>{current.roleName}</Col>
            </Row>
            <Row>
              <Col span={8} style={{ fontWeight: "bold" }}>
                User
              </Col>
              <Col span={1}>:</Col>
              <Col span={15}>{current.userName}</Col>
            </Row>
            <Row>
              <Col span={8} style={{ fontWeight: "bold" }}>
                Activity
              </Col>
              <Col span={1}>:</Col>
              <Col span={15}>{current.activity}</Col>
            </Row>
            <Row>
              <Col span={8} style={{ fontWeight: "bold" }}>
                Data
              </Col>
              <Col span={1}>:</Col>
              <Col span={15}>
                <ul>
                  {current.data_array &&
                    Object.entries(current.data_array).map(([key, value]) => {
                      if (typeof value === "object" && value !== null) {
                        return (
                          <li key={key}>
                            <strong>{key}</strong>
                            <ul>
                              {Object.entries(value).map(
                                ([subKey, subValue]) => (
                                  <li key={subKey}>
                                    <strong>{subKey}:</strong>{" "}
                                    {String(subValue)}
                                  </li>
                                ),
                              )}
                            </ul>
                          </li>
                        );
                      }
                      return (
                        <li key={key}>
                          <strong>{key}:</strong> {String(value)}
                        </li>
                      );
                    })}
                </ul>
              </Col>
            </Row>
          </>
        )}
      </Modal>
    </>
  );
};

export default TableActivityLog;
