export const bulkUploadErrorMessages: Record<string, string> = {
    brand_not_found:
        "Brand tidak ditemukan. Pastikan nama file sesuai dengan slug atau nama brand di database.",
    brand_ambiguous:
        "Lebih dari satu brand dengan nama yang mirip. Gunakan slug yang spesifik.",
    invalid_filename_format: "Format nama file tidak valid.",
    upload_failed: "Gagal upload file ke server.",
    no_filename: "File tidak memiliki nama.",
};

export const getErrorMessage = (reason: string): string => {
    return bulkUploadErrorMessages[reason] || reason;
};
