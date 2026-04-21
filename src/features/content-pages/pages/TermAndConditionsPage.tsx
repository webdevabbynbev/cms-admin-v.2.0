import { ContentPageEditor } from '../components';
import { ContentSlug } from '../types';

const TermAndConditionsPage = () => (
  <ContentPageEditor
    slug={ContentSlug.TermAndConditions}
    description="Syarat dan ketentuan yang mengikat pengguna."
  />
);

export default TermAndConditionsPage;
