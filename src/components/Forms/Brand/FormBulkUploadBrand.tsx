import React, { useState } from "react";
import {
    Upload,
    Button,
    Table,
    Card,
    Progress,
    message,
    Space,
    Alert,
    Image,
    Typography,
    Grid,
} from "antd";
import type { UploadFile, UploadProps } from "antd";
import {
    UploadOutlined,
    DeleteOutlined,
    InboxOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    ArrowLeftOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { fileValidator } from "../../../utils/fileValidator";
import { getErrorMessage } from "../../../utils/errorMessages";
import type {
    BulkUploadResponse,
} from "../../../services/brandService";

const { Dragger } = Upload;
const { Text, Title } = Typography;

interface FormBulkUploadBrandProps {
    uploadType: "logo" | "banner";
    onUpload: (files: File[]) => Promise<BulkUploadResponse>;
    title: string;
    stackHeaderOnMobile?: boolean;
}

const FormBulkUploadBrand: React.FC<FormBulkUploadBrandProps> = ({
    uploadType,
    onUpload,
    title,
    stackHeaderOnMobile = false,
}) => {
    const screens = Grid.useBreakpoint();
    const isMobile = !screens.md;
    const navigate = useNavigate();
    const [fileList, setFileList] = useState<UploadFile[]>([]);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadResult, setUploadResult] = useState<BulkUploadResponse | null>(
        null
    );

    const handleUpload = async () => {
        if (fileList.length === 0) {
            message.warning("Pilih file terlebih dahulu");
            return;
        }

        // Validate files
        const files = fileList.map((f) => (f.originFileObj || f) as File);
        const validation = fileValidator.validateFiles(files);

        if (!validation.valid) {
            const errorMessages = Object.entries(validation.errors)
                .map(([filename, error]) => `${filename}: ${error}`)
                .join("\n");
            message.error(`Validasi gagal:\n${errorMessages}`);
            return;
        }

        setUploading(true);
        setUploadProgress(0);

        try {
            // Simulate progress
            const progressInterval = setInterval(() => {
                setUploadProgress((prev) => {
                    if (prev >= 90) {
                        clearInterval(progressInterval);
                        return 90;
                    }
                    return prev + 10;
                });
            }, 300);

            const result = await onUpload(files);

            clearInterval(progressInterval);
            setUploadProgress(100);

            setUploadResult(result);

            if (result.serve.success > 0) {
                message.success(
                    `Upload selesai! Sukses: ${result.serve.success}, Gagal: ${result.serve.failed}`
                );
            } else {
                message.error("Semua file gagal diupload");
            }
        } catch (error: any) {
            message.error(
                error?.response?.data?.message || "Upload gagal. Silakan coba lagi."
            );
        } finally {
            setUploading(false);
        }
    };

    const handleClearAll = () => {
        setFileList([]);
        setUploadResult(null);
        setUploadProgress(0);
    };

    const uploadProps: UploadProps = {
        multiple: true,
        fileList,
        beforeUpload: (file) => {
            const validation = fileValidator.validateFile(file);
            if (!validation.valid) {
                message.error(`${file.name}: ${validation.error}`);
                return Upload.LIST_IGNORE;
            }

            setFileList((prev) => [...prev, file as any]);
            return false;
        },
        onRemove: (file) => {
            setFileList((prev) => prev.filter((f) => f.uid !== file.uid));
        },
        accept: ".jpg,.jpeg,.png,.webp",
        listType: "picture",
    };

    const successColumns = [
        {
            title: "Brand Slug",
            dataIndex: "slug",
            key: "slug",
            render: (text: string) => <Text strong>{text}</Text>,
        },
        {
            title: uploadType === "logo" ? "Logo URL" : "Banner URL",
            dataIndex: uploadType === "logo" ? "logoUrl" : "bannerUrl",
            key: "url",
            render: (url: string) => (
                <Space>
                    <Image src={url} width={50} height={50} style={{ objectFit: "contain" }} />
                    <a href={url} target="_blank" rel="noreferrer">
                        {url}
                    </a>
                </Space>
            ),
        },
    ];

    const errorColumns = [
        {
            title: "Nama File",
            dataIndex: "file",
            key: "file",
            render: (text: string) => <Text>{text}</Text>,
        },
        {
            title: "Alasan Error",
            dataIndex: "reason",
            key: "reason",
            render: (reason: string) => (
                <Text type="danger">{getErrorMessage(reason)}</Text>
            ),
        },
    ];

    return (
        <div>
            <Card>
                <Space
                    align={isMobile && stackHeaderOnMobile ? "start" : "center"}
                    direction={isMobile && stackHeaderOnMobile ? "vertical" : "horizontal"}
                    style={{ marginBottom: 20, width: "100%" }}
                >
                    <Button
                        icon={<ArrowLeftOutlined />}
                        onClick={() => navigate("/dashboard")}
                    >
                        Kembali
                    </Button>
                    <Title level={4} style={{ margin: 0 }}>{title}</Title>
                </Space>

                {fileList.length > 0 && (
                    <div style={{ marginBottom: 20 }}>
                        <Space>
                            <Button
                                type="primary"
                                onClick={handleUpload}
                                disabled={uploading}
                                loading={uploading}
                                icon={<UploadOutlined />}
                            >
                                {uploading ? "Uploading..." : `Upload ${fileList.length} File(s)`}
                            </Button>
                            <Button
                                onClick={handleClearAll}
                                disabled={uploading}
                                icon={<DeleteOutlined />}
                            >
                                Clear All
                            </Button>
                        </Space>
                    </div>
                )}

                <Dragger {...uploadProps} disabled={uploading}>
                    <p className="ant-upload-drag-icon">
                        <InboxOutlined />
                    </p>
                    <p className="ant-upload-text">
                        Klik atau seret file ke area ini untuk upload
                    </p>
                    <p className="ant-upload-hint">
                        Support multiple files. Format: JPG, JPEG, PNG, WEBP (Max 10MB per
                        file)
                    </p>
                    <Alert
                        message="Informasi Penamaan File"
                        description="Sistem otomatis mengubah '_' menjadi spasi, '&' menjadi 'and', dan '+' menjadi 'plus'. Contoh: 'Lilith & Eve.png' akan terbaca sebagai 'Lilith And Eve'."
                        type="info"
                        showIcon
                        style={{ marginTop: 16, textAlign: "left" }}
                    />
                </Dragger>

                {uploading && uploadProgress > 0 && (
                    <div style={{ marginTop: 20 }}>
                        <Progress percent={uploadProgress} status="active" />
                    </div>
                )}
            </Card>

            {uploadResult && (
                <Card style={{ marginTop: 20 }}>
                    <Title level={5}>Hasil Upload</Title>

                    <Space direction="vertical" style={{ width: "100%", marginBottom: 20 }}>
                        <Alert
                            message={`Total: ${uploadResult.serve.total} | Berhasil: ${uploadResult.serve.success} | Gagal: ${uploadResult.serve.failed}`}
                            type={uploadResult.serve.failed === 0 ? "success" : "warning"}
                            showIcon
                        />
                    </Space>

                    {uploadResult.serve.results.length > 0 && (
                        <>
                            <Title level={5}>
                                <CheckCircleOutlined style={{ color: "#52c41a" }} /> File Berhasil
                            </Title>
                            <Table
                                dataSource={uploadResult.serve.results}
                                columns={successColumns}
                                rowKey="slug"
                                pagination={false}
                                size="small"
                                style={{ marginBottom: 20 }}
                            />
                        </>
                    )}

                    {uploadResult.serve.errors.length > 0 && (
                        <>
                            <Title level={5}>
                                <CloseCircleOutlined style={{ color: "#ff4d4f" }} /> File Gagal
                            </Title>
                            <Table
                                dataSource={uploadResult.serve.errors}
                                columns={errorColumns}
                                rowKey="file"
                                pagination={false}
                                size="small"
                            />
                        </>
                    )}
                </Card>
            )}
        </div>
    );
};

export default FormBulkUploadBrand;
