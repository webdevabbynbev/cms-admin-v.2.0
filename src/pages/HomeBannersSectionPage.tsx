import React from "react";
import { useParams } from "react-router-dom";
import TableHomeSectionBanners from "../components/Tables/HomeBanners/TableHomeSectionBanners";

const HomeBannersSectionPage: React.FC = () => {
  const params = useParams();
  const sectionId = params.sectionId;

  if (!sectionId) {
    return null;
  }

  return <TableHomeSectionBanners sectionId={sectionId} />;
};

export default HomeBannersSectionPage;
