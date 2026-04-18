import http from "../api/http";

export interface BulkUploadResult {
    slug: string;
    logoUrl?: string;
    bannerUrl?: string;
}

export interface BulkUploadError {
    file: string;
    reason: string;
}

export interface BulkUploadResponse {
    message: string;
    serve: {
        total: number;
        processed: number;
        success: number;
        failed: number;
        results: BulkUploadResult[];
        errors: BulkUploadError[];
    };
}

export const brandService = {
    bulkUploadLogos: async (files: File[]): Promise<BulkUploadResponse> => {
        const formData = new FormData();
        files.forEach((file) => {
            formData.append("files", file);
        });

        const response = await http.post<BulkUploadResponse>(
            "/brands/bulk/logos",
            formData,
            {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
                timeout: 600000, // 10 menit
            }
        );
        return response.data;
    },

    bulkUploadBanners: async (files: File[]): Promise<BulkUploadResponse> => {
        const formData = new FormData();
        files.forEach((file) => {
            formData.append("files", file);
        });

        const response = await http.post<BulkUploadResponse>(
            "/brands/bulk/banners",
            formData,
            {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
                timeout: 600000,
            }
        );
        return response.data;
    },
};
