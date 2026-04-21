import { ContentPageEditor } from '../components';
import { ContentSlug } from '../types';

const ReturnPolicyPage = () => (
  <ContentPageEditor
    slug={ContentSlug.ReturnPolicy}
    description="Kebijakan pengembalian produk."
  />
);

export default ReturnPolicyPage;
