import React from "react";
import FormBulkUploadBrand from "../components/Forms/Brand/FormBulkUploadBrand";
import { brandService } from "../services/brandService";

const BulkUploadBrandLogoPage: React.FC = () => {
    return (
        <div className="site-layout-background" style={{ padding: 24, minHeight: 360 }}>
            <FormBulkUploadBrand
                title="Bulk Upload Brand Logos"
                uploadType="logo"
                onUpload={brandService.bulkUploadLogos}
                stackHeaderOnMobile
            />
        </div>
    );
};

export default BulkUploadBrandLogoPage;
