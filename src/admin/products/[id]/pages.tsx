import { Row, Col, Space } from "antd";
import MainLayout from "../../../layout/MainLayout";
import BulkFolderMediaUpload from "../../../components/Uploads/BulkFolderMediaUpload";
import LinkFromS3MediaUpload from "../../../components/Uploads/LinkFromS3MediaUpload";

export default function ProductMediasPage() {
  return (
    <MainLayout title="Product Media">
      <div style={{ padding: 16 }}>
        <Row gutter={[24, 24]}>
          <Col xs={24}>
            <Space direction="vertical" style={{ width: "100%" }} size={16}>
              <LinkFromS3MediaUpload />
              <BulkFolderMediaUpload />
            </Space>
          </Col>
        </Row>
      </div>
    </MainLayout>
  );
}