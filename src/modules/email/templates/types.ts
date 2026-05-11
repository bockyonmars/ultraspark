export type EmailTemplateResult = {
  subject: string;
  previewText: string;
  html: string;
  text: string;
};

export type EmailTemplateVariables = {
  customerName?: string;
  serviceType?: string;
  requestedDate?: string;
  requestedTime?: string;
  location?: string;
  phoneNumber?: string;
  email?: string;
  message?: string;
  quoteDetails?: string;
  propertyType?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyWebsite?: string;
  logoUrl?: string;
  watermarkLogoUrl?: string;
};

export type DetailItem = {
  label: string;
  value: string;
};
