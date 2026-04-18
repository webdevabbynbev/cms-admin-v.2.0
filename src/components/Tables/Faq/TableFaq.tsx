import React from "react";
import {
  Table,
  Button,
  Input,
  Card,
  Popconfirm,
  Select,
  Modal,
  Space,
  Tooltip,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { PlusOutlined, DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { useSearchParams } from "react-router-dom";
import FormFAQ from "../../Forms/Faq/FormFaq";
import http from "../../../api/http";

type FAQRecord = {
  id: number | string;
  question: string;
  answer: string;
};

type ServePayload = {
  currentPage: string | number;
  perPage: string | number;
  total: string | number;
  data: FAQRecord[];
};

type ListResponse = {
  data?: {
    serve: ServePayload;
  };
};

type ColumnsCtx = {
  fetch: () => void;
  setOpen: (open: boolean) => void;
  setCurrent: (rec: FAQRecord | false) => void;
};

const columns = (props: ColumnsCtx): ColumnsType<FAQRecord> => [
  {
    title: "Question",
    dataIndex: "question",
  },
  {
    title: "Answer",
    dataIndex: "answer",
  },
  {
    title: "#",
    width: "10%",
    align: "center",
    dataIndex: "action",
    render: (_: unknown, record: FAQRecord) => (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
        }}
      >
        <Tooltip title="Edit FAQ">
          <Button
            type="primary"
            key="/edit"
            icon={<EditOutlined />}
            onClick={() => {
              props.setCurrent(record);
              props.setOpen(true);
            }}
          />
        </Tooltip>

        <Tooltip title="Delete FAQ">
          <Popconfirm
            placement="left"
            title="Are your sure want delete this data?"
            onConfirm={async () => {
              await http({
                url: `/admin/faq/${record.id}`,
                method: "DELETE",
              });
              props.fetch();
            }}
            okText="Yes"
            cancelText="No"
          >
            <Button danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Tooltip>
      </div>
    ),
  },
];

const TableFaq: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = React.useState<FAQRecord[]>([]);

  // Derived from URL
  const page = Number(searchParams.get("page")) || 1;
  const pageSize = Number(searchParams.get("per_page")) || 10;
  const searchName = searchParams.get("name") || "";

  const [open, setOpen] = React.useState<boolean>(false);
  const [current, setCurrent] = React.useState<FAQRecord | false>(false);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [total, setTotal] = React.useState(0);
  const { Search } = Input;

  const fetchList = React.useCallback(async () => {
    setLoading(true);
    try {
      const resp = (await http.get(
        `/admin/faq?name=${searchName}&page=${page}&per_page=${pageSize}`,
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
        <div
          className="flex flex-wrap"
          style={{ width: "100%", alignItems: "flex-end" }}
        >
          <div className="flex align-center">
            <span style={{ fontSize: 12 }}>Show</span>
            <Select<number>
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
            style={{ marginLeft: "auto" }}
            className="flex align-center mt-2"
          >
            <Search
              placeholder="Search Faq"
              defaultValue={searchName}
              onSearch={(val) => {
                setSearchParams((prev) => {
                  if (val.trim()) prev.set("name", val.trim());
                  else prev.delete("name");
                  prev.set("page", "1");
                  return prev;
                });
              }}
            />
            <Button
              icon={<PlusOutlined />}
              type="primary"
              onClick={() => setOpen(true)}
            >
              Create New
            </Button>
          </Space>
        </div>
      </Card>

      <div className="overflow-x-auto md:overflow-visible">
        <Table<FAQRecord>
          style={{ marginTop: 10 }}
          columns={columns({
            fetch: fetchList,
            setOpen: (v) => setOpen(v),
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
        open={open}
        title="Manage FAQ"
        onCancel={async () => {
          setOpen(false);
          setCurrent(false);
          fetchList();
        }}
        footer={null}
      >
        <FormFAQ
          data={current || undefined}
          handleClose={() => {
            setOpen(false);
            setCurrent(false);
            fetchList();
          }}
          fetch={fetchList}
        />
      </Modal>
    </>
  );
};

export default TableFaq;
