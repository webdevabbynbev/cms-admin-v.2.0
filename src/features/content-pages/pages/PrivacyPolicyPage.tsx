import { ContentPageEditor } from '../components';
import { ContentSlug } from '../types';

const PrivacyPolicyPage = () => (
  <ContentPageEditor
    slug={ContentSlug.PrivacyPolicy}
    description="Kebijakan privasi yang ditampilkan di halaman publik."
  />
);

export default PrivacyPolicyPage;
