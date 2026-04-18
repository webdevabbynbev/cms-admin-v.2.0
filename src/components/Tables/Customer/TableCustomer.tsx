import React from "react";
import { InfoCircleOutlined } from "@ant-design/icons";
import {
  Col,
  Row,
  Space,
  Card,
  Modal,
  Select,
  Table,
  Button,
  Input,
  Tooltip,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import moment from "moment";
import { useSearchParams } from "react-router-dom";
import http from "../../../api/http";

type CustomerRecord = {
  id: number | string;
  name: string;
  email: string;
  phone_number?: string;
  phoneNumber?: string;
  gender?: number | null;
  dob?: string | null;
  address?: string | null;
  createdAt: string;
};

type ServePayload = {
  currentPage: string | number;
  perPage: string | number;
  total: string | number;
  data: CustomerRecord[];
};

type ListResponse = {
  data?: {
    serve: ServePayload;
  };
};

type ColumnsCtx = {
  setOpen: (open: boolean) => void;
  setCurrent: (rec: CustomerRecord | false) => void;
};

const columns = (props: ColumnsCtx): ColumnsType<CustomerRecord> => [
  {
    title: "Name",
    dataIndex: "name",
  },
  {
    title: "Email",
    dataIndex: "email",
  },
  {
    title: "Phone Number",
    dataIndex: "phone_number",
    render: (val: string | undefined, record) =>
      val ?? record.phoneNumber ?? "-",
  },
  {
    title: "Gender",
    dataIndex: "gender",
    render: (val?: number | null) => {
      if (val === 1) return "Male";
      if (val === 2) return "Female";
      return "";
    },
  },
  {
    title: "Date of Birthday",
    dataIndex: "dob",
    render: (val?: string | null) =>
      val ? moment(val).format("YYYY MMMM DD") : "",
  },
  {
    title: "Created At",
    dataIndex: "createdAt",
    render: (text: string) => moment(text).format("YYYY MMMM DD HH:mm"),
  },
  {
    title: "#",
    width: "10%",
    align: "center",
    dataIndex: "action",
    render: (_: unknown, record) => (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 10,
        }}
      >
        <Tooltip title="View Customer Details">
          <Button
            key="/detail"
            icon={<InfoCircleOutlined />}
            onClick={() => {
              props.setCurrent(record);
              props.setOpen(true);
            }}
          />
        </Tooltip>
      </div>
    ),
  },
];

const TableCustomer: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = React.useState<CustomerRecord[]>([]);

  // Derived from URL
  const page = Number(searchParams.get("page")) || 1;
  const pageSize = Number(searchParams.get("per_page")) || 10;
  const searchName = searchParams.get("q") || "";

  const [open, setOpen] = React.useState<boolean>(false);
  const [current, setCurrent] = React.useState<CustomerRecord | false>(false);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [total, setTotal] = React.useState(0);
  const { Search } = Input;

  const fetchList = React.useCallback(async () => {
    setLoading(true);
    try {
      const resp = (await http.get(
        `/admin/customers?page=${page}&per_page=${pageSize}&q=${searchName}`,
      )) as ListResponse;

      const serve = resp?.data?.serve;
      if (serve) {
        setData(serve.data || []);
        setTotal(Number(serve.total));
      }
    } catch (e: any) {
      message.error(
        e?.response?.data?.message || e.message || "Gagal ambil data customer",
      );
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
        <div
          className="flex flex-col items-start gap-2 md:flex-row md:flex-wrap md:items-end"
          style={{ width: "100%" }}
        >
          <div className="flex align-center">
            <span style={{ fontSize: 12 }}>Show</span>
            <Select<number>
              defaultActiveFirstOption={false}
              style={{ width: 80, marginLeft: 10, marginRight: 10 }}
              value={pageSize}
              onChange={(ps) => {
                setSearchParams((prev) => {
                  prev.set("per_page", String(ps));
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

          <Space
            className="mt-1 flex w-full items-center md:mt-2 md:ml-auto md:w-auto"
          >
            <Search
              placeholder="Search Customer"
              defaultValue={searchName}
              style={{ width: "100%" }}
              onSearch={(val) => {
                setSearchParams((prev) => {
                  if (val.trim()) prev.set("q", val.trim());
                  else prev.delete("q");
                  prev.set("page", "1");
                  return prev;
                });
              }}
            />
          </Space>
        </div>
      </Card>

      <div className="overflow-x-auto md:overflow-visible">
        <Table<CustomerRecord>
          style={{ marginTop: 10 }}
          columns={columns({
            setOpen: (v) => setOpen(v),
            setCurrent: (v) => setCurrent(v),
          })}
          rowKey={(record) => String(record.id)}
          dataSource={data}
          scroll={{ x: "max-content" }}
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
        />
      </div>

      <Modal
        centered
        open={open}
        title="Detail Customer"
        onCancel={() => {
          setOpen(false);
          setCurrent(false);
        }}
        footer={null}
        width={600}
      >
        {current && (
          <>
            <Row style={{ marginTop: "0.5rem" }}>
              <Col span={8} style={{ fontWeight: "bold" }}>
                Name
              </Col>
              <Col span={1}>:</Col>
              <Col span={15}>{current.name}</Col>
            </Row>
            <Row>
              <Col span={8} style={{ fontWeight: "bold" }}>
                Email
              </Col>
              <Col span={1}>:</Col>
              <Col span={15}>{current.email}</Col>
            </Row>
            <Row>
              <Col span={8} style={{ fontWeight: "bold" }}>
                Phone Number
              </Col>
              <Col span={1}>:</Col>
              <Col span={15}>
                {current.phone_number ?? current.phoneNumber ?? "-"}
              </Col>
            </Row>
            <Row>
              <Col span={8} style={{ fontWeight: "bold" }}>
                Date of Birthday
              </Col>
              <Col span={1}>:</Col>
              <Col span={15}>
                {current.dob ? moment(current.dob).format("YYYY MMMM DD") : ""}
              </Col>
            </Row>
            <Row>
              <Col span={8} style={{ fontWeight: "bold" }}>
                Address
              </Col>
              <Col span={1}>:</Col>
              <Col span={15}>{current.address ?? "-"}</Col>
            </Row>
            <Row>
              <Col span={8} style={{ fontWeight: "bold" }}>
                Gender
              </Col>
              <Col span={1}>:</Col>
              <Col span={15}>
                {current.gender === 1
                  ? "Male"
                  : current.gender === 2
                    ? "Female"
                    : ""}
              </Col>
            </Row>
            <Row>
              <Col span={8} style={{ fontWeight: "bold" }}>
                Created At
              </Col>
              <Col span={1}>:</Col>
              <Col span={15}>
                {moment(current.createdAt).format("YYYY MMMM DD HH:mm")}
              </Col>
            </Row>
          </>
        )}
      </Modal>
    </>
  );
};

export default TableCustomer;
