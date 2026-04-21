export enum ContentSlug {
  PrivacyPolicy = 'privacy-policy',
  TermAndConditions = 'term-and-conditions',
  ReturnPolicy = 'return-policy',
  AboutUs = 'about-us',
  ContactUs = 'contact-us',
}

export const CONTENT_TITLES: Record<ContentSlug, string> = {
  [ContentSlug.PrivacyPolicy]: 'Privacy Policy',
  [ContentSlug.TermAndConditions]: 'Terms & Conditions',
  [ContentSlug.ReturnPolicy]: 'Return Policy',
  [ContentSlug.AboutUs]: 'About Us',
  [ContentSlug.ContactUs]: 'Contact Us',
};

export interface ContentDocument {
  value: string;
}

export interface ContentPayload {
  value: string;
}
