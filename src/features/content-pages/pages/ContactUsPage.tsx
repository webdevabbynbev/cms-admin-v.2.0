import { ContentPageEditor } from '../components';
import { ContentSlug } from '../types';

const ContactUsPage = () => (
  <ContentPageEditor
    slug={ContentSlug.ContactUs}
    description="Informasi kontak yang tampil di halaman Contact."
  />
);

export default ContactUsPage;
