const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "webp"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const fileValidator = {
    validateFile: (file: File): { valid: boolean; error?: string } => {
        // Check file extension
        const ext = file.name.split(".").pop()?.toLowerCase();
        if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
            return {
                valid: false,
                error: `Format file tidak didukung. Hanya boleh: ${ALLOWED_EXTENSIONS.join(", ")}`,
            };
        }

        // Check file size
        if (file.size > MAX_FILE_SIZE) {
            return {
                valid: false,
                error: "Ukuran file terlalu besar. Maksimal 10MB per file.",
            };
        }

        return { valid: true };
    },

    validateFiles: (
        files: File[]
    ): { valid: boolean; errors: Record<string, string> } => {
        const errors: Record<string, string> = {};

        files.forEach((file) => {
            const result = fileValidator.validateFile(file);
            if (!result.valid && result.error) {
                errors[file.name] = result.error;
            }
        });

        return {
            valid: Object.keys(errors).length === 0,
            errors,
        };
    },
};
