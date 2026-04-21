import { ContentPageEditor } from '../components';
import { ContentSlug } from '../types';

const AboutUsPage = () => (
  <ContentPageEditor
    slug={ContentSlug.AboutUs}
    description="Deskripsi perusahaan yang tampil di halaman About."
  />
);

export default AboutUsPage;
