import { PDFDocument, rgb, StandardFonts, PDFPage, PDFImage } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

// Sanitize text for PDF - remove/replace characters that WinAnsi encoding can't handle
// WinAnsi can encode printable ASCII (0x20-0x7E) and some extended characters (0xA0-0xFF)
const sanitizeForPDF = (text: string): string => {
  if (!text) return '';
  return text
    // Replace tabs with spaces
    .replace(/\t/g, ' ')
    // Replace newlines/carriage returns with spaces
    .replace(/[\r\n]/g, ' ')
    // Remove other control characters (0x00-0x1F except those already handled)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
    // Replace multiple spaces with single space
    .replace(/\s+/g, ' ')
    .trim();
};

interface ApplicationData {
  // Funding Request
  fundingSpecialistName?: string;
  amountRequested: string;
  useOfFunds: string;

  // Business Information
  legalBusinessName: string;
  dba?: string;
  businessAddress: string;
  businessPhoneCountry: string;
  businessPhone: string;
  businessStartDate: string;
  legalStructure: string;
  stateOfIncorporation: string;
  federalTaxId: string;
  industry?: string;
  website?: string;

  // Primary Owner
  ownerFirstName: string;
  ownerLastName: string;
  ownerTitle: string;
  ownershipPercentage: string;
  ownerHomeAddress: string;
  ownerSSN: string;
  ownerDOB: string;
  ownerPhoneCountry: string;
  ownerPhone: string;
  ownerEmail: string;
  ownerDriversLicenseState: string;
  ownerDriversLicense: string;

  // Second Owner
  hasSecondOwner: string;
  secondOwnerFirstName?: string;
  secondOwnerLastName?: string;
  secondOwnerTitle?: string;
  secondOwnerOwnershipPercentage?: string;
  secondOwnerHomeAddress?: string;
  secondOwnerSSN?: string;
  secondOwnerDOB?: string;
  secondOwnerPhoneCountry?: string;
  secondOwnerPhone?: string;
  secondOwnerEmail?: string;
  secondOwnerDriversLicenseState?: string;
  secondOwnerDriversLicense?: string;

  // Financial
  grossAnnualSales: string;
  averageMonthlyRevenue: string;
  openLoansAdvances?: string;
  hasBankruptcy?: string;

  // Properties
  properties?: Array<{
    address: string;
    propertyType: string;
    yearAcquired: string;
    purchasePrice: string;
    currentValue: string;
    loanBalance: string;
    lender: string;
    titleHolders: string;
  }>;
}

// Format currency for display
const formatCurrency = (value: string): string => {
  if (!value) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(parseInt(value));
};

// Format SSN for display (full - for underwriters)
const formatSSN = (value: string): string => {
  if (!value) return 'N/A';
  // Remove any existing formatting
  const digits = value.replace(/\D/g, '');
  if (digits.length !== 9) return value;
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
};

// Mask email for privacy (show first 2 chars and domain)
const maskEmail = (email: string): string => {
  if (!email || !email.includes('@')) return '***@***.***';
  const [localPart, domain] = email.split('@');
  const maskedLocal = localPart.length > 2
    ? localPart.slice(0, 2) + '*'.repeat(Math.min(localPart.length - 2, 6))
    : '*'.repeat(localPart.length);
  const domainParts = domain.split('.');
  const maskedDomain = domainParts.length > 1
    ? domainParts[0].slice(0, 1) + '*'.repeat(Math.min(domainParts[0].length - 1, 4)) + '.' + domainParts.slice(1).join('.')
    : '*'.repeat(4) + '.com';
  return `${maskedLocal}@${maskedDomain}`;
};

// Mask phone for privacy (show last 4 digits)
const maskPhone = (phone: string, countryCode?: string): string => {
  if (!phone) return '***-***-****';
  // Remove any non-digit characters
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) return '***-***-****';
  const lastFour = digits.slice(-4);
  const prefix = countryCode ? `${countryCode} ` : '';
  return `${prefix}***-***-${lastFour}`;
};

// Format EIN for display
const formatEIN = (value: string): string => {
  if (!value) return 'N/A';
  if (value.length <= 2) return value;
  return `${value.slice(0, 2)}-${value.slice(2, 9)}`;
};

// Get state name from code
const getStateName = (code: string): string => {
  const states: { [key: string]: string } = {
    AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
    CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', FL: 'Florida', GA: 'Georgia',
    HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa',
    KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland',
    MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri',
    MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey',
    NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio',
    OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina',
    SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont',
    VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
    DC: 'District of Columbia',
  };
  return states[code] || code;
};

// Get legal structure name
const getLegalStructureName = (value: string): string => {
  const structures: { [key: string]: string } = {
    sole_proprietorship: 'Sole Proprietorship',
    partnership: 'Partnership',
    llc: 'Limited Liability Company (LLC)',
    llp: 'Limited Liability Partnership (LLP)',
    corporation: 'Corporation (C-Corp)',
    s_corporation: 'S Corporation (S-Corp)',
    nonprofit: 'Non-Profit Organization',
    cooperative: 'Cooperative',
    professional_corporation: 'Professional Corporation (PC)',
    benefit_corporation: 'Benefit Corporation (B-Corp)',
  };
  return structures[value] || value;
};

// Get property type name
const getPropertyTypeName = (value: string): string => {
  const types: { [key: string]: string } = {
    residential: 'Residential',
    commercial: 'Commercial',
    industrial: 'Industrial',
    land: 'Land',
    mixed_use: 'Mixed Use',
  };
  return types[value] || value || 'N/A';
};

// Helper to draw text and return new Y position
function drawText(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  font: Awaited<ReturnType<typeof PDFDocument.prototype.embedFont>>,
  size: number,
  color = rgb(0.06, 0.09, 0.17) // Dark navy
): number {
  page.drawText(text, { x, y, size, font, color });
  return y - size - 4;
}

// Helper to draw a field (label + value)
function drawField(
  page: PDFPage,
  label: string,
  value: string,
  x: number,
  y: number,
  labelFont: Awaited<ReturnType<typeof PDFDocument.prototype.embedFont>>,
  valueFont: Awaited<ReturnType<typeof PDFDocument.prototype.embedFont>>,
  maxWidth: number = 250
): number {
  // Draw label
  page.drawText(label, {
    x,
    y,
    size: 9,
    font: labelFont,
    color: rgb(0.4, 0.45, 0.55), // Muted gray
  });

  // Draw value below label
  const valueY = y - 12;

  // Handle long values by truncating if needed
  // Sanitize to remove control characters that WinAnsi can't encode
  let displayValue = sanitizeForPDF(value) || 'N/A';
  const valueWidth = valueFont.widthOfTextAtSize(displayValue, 10);
  if (valueWidth > maxWidth) {
    while (valueFont.widthOfTextAtSize(displayValue + '...', 10) > maxWidth && displayValue.length > 0) {
      displayValue = displayValue.slice(0, -1);
    }
    displayValue += '...';
  }

  page.drawText(displayValue, {
    x,
    y: valueY,
    size: 10,
    font: valueFont,
    color: rgb(0.06, 0.09, 0.17),
  });

  return y - 35;
}

// Helper to draw a section header
function drawSectionHeader(
  page: PDFPage,
  title: string,
  y: number,
  font: Awaited<ReturnType<typeof PDFDocument.prototype.embedFont>>,
  pageWidth: number
): number {
  const margin = 50;

  // Draw gold line
  page.drawLine({
    start: { x: margin, y: y + 5 },
    end: { x: pageWidth - margin, y: y + 5 },
    thickness: 1,
    color: rgb(0.72, 0.53, 0.04), // Gold color
  });

  // Draw section title
  page.drawText(title, {
    x: margin,
    y: y - 15,
    size: 12,
    font,
    color: rgb(0.72, 0.53, 0.04), // Gold color
  });

  return y - 40;
}

export async function generateApplicationPDF(
  applicationData: ApplicationData,
  signature: string | null,
  secondSignature: string | null,
  submissionDate: string,
  bankStatementNames: string[]
): Promise<Buffer> {
  // Create a new PDF document
  const pdfDoc = await PDFDocument.create();

  // Embed fonts
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const timesRoman = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const timesRomanBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

  // Load and embed logo
  let logoImage: PDFImage | undefined;
  try {
    const logoPath = path.join(process.cwd(), 'public', 'logo.png');
    const logoBytes = fs.readFileSync(logoPath);
    logoImage = await pdfDoc.embedPng(logoBytes);
  } catch {
    // Silently fail if logo can't be loaded
  }

  // Page dimensions
  const pageWidth = 612; // Letter size
  const pageHeight = 792;
  const margin = 50;
  const contentWidth = pageWidth - margin * 2;

  // Create first page
  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  // Draw watermark (semi-transparent logo in center) on all pages
  const drawWatermark = (p: PDFPage) => {
    if (logoImage) {
      const watermarkSize = 300;
      const logoAspect = logoImage.width / logoImage.height;
      const watermarkWidth = watermarkSize;
      const watermarkHeight = watermarkSize / logoAspect;

      p.drawImage(logoImage, {
        x: (pageWidth - watermarkWidth) / 2,
        y: (pageHeight - watermarkHeight) / 2,
        width: watermarkWidth,
        height: watermarkHeight,
        opacity: 0.15, // Visible watermark
      });
    }
  };

  drawWatermark(page);

  // Draw header with logo
  if (logoImage) {
    const logoHeight = 60;
    const logoWidth = (logoImage.width / logoImage.height) * logoHeight;
    page.drawImage(logoImage, {
      x: (pageWidth - logoWidth) / 2,
      y: y - logoHeight,
      width: logoWidth,
      height: logoHeight,
    });
    y -= logoHeight + 20;
  }

  // Title
  const title = 'Business Funding Application';
  const titleWidth = timesRomanBold.widthOfTextAtSize(title, 20);
  page.drawText(title, {
    x: (pageWidth - titleWidth) / 2,
    y,
    size: 20,
    font: timesRomanBold,
    color: rgb(0.06, 0.09, 0.17),
  });
  y -= 25;

  // Submission date
  const dateText = `Submitted on ${submissionDate}`;
  const dateWidth = helvetica.widthOfTextAtSize(dateText, 10);
  page.drawText(dateText, {
    x: (pageWidth - dateWidth) / 2,
    y,
    size: 10,
    font: helvetica,
    color: rgb(0.4, 0.45, 0.55),
  });
  y -= 40;

  // Helper to check if we need a new page
  const checkNewPage = (requiredSpace: number): void => {
    if (y < margin + requiredSpace) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      drawWatermark(page);
      y = pageHeight - margin;
    }
  };

  // ===================
  // FUNDING INFORMATION
  // ===================
  y = drawSectionHeader(page, 'Funding Information', y, helveticaBold, pageWidth);

  const col1X = margin;
  const col2X = margin + contentWidth / 2;

  y = drawField(page, 'Amount Requested', formatCurrency(applicationData.amountRequested), col1X, y, helvetica, helveticaBold);
  drawField(page, 'Funding Specialist', applicationData.fundingSpecialistName || 'N/A', col2X, y + 35, helvetica, helveticaBold);

  y = drawField(page, 'Use of Funds', applicationData.useOfFunds, col1X, y, helvetica, helveticaBold, contentWidth);
  y -= 10;

  // ======================
  // BUSINESS INFORMATION
  // ======================
  checkNewPage(200);
  y = drawSectionHeader(page, 'Business Information', y, helveticaBold, pageWidth);

  y = drawField(page, 'Legal Business Name', applicationData.legalBusinessName, col1X, y, helvetica, helveticaBold);
  drawField(page, 'DBA', applicationData.dba || 'N/A', col2X, y + 35, helvetica, helveticaBold);

  y = drawField(page, 'Business Phone', maskPhone(applicationData.businessPhone, applicationData.businessPhoneCountry), col1X, y, helvetica, helveticaBold);
  drawField(page, 'Business Start Date', applicationData.businessStartDate, col2X, y + 35, helvetica, helveticaBold);

  y = drawField(page, 'Legal Structure', getLegalStructureName(applicationData.legalStructure), col1X, y, helvetica, helveticaBold);
  drawField(page, 'State of Incorporation', getStateName(applicationData.stateOfIncorporation), col2X, y + 35, helvetica, helveticaBold);

  y = drawField(page, 'Federal Tax ID (EIN)', formatEIN(applicationData.federalTaxId), col1X, y, helvetica, helveticaBold);
  drawField(page, 'Industry', applicationData.industry || 'N/A', col2X, y + 35, helvetica, helveticaBold);

  y = drawField(page, 'Website', applicationData.website || 'N/A', col1X, y, helvetica, helveticaBold);

  y = drawField(page, 'Business Address', applicationData.businessAddress, col1X, y, helvetica, helveticaBold, contentWidth);
  y -= 10;

  // =====================
  // PRIMARY OWNER
  // =====================
  checkNewPage(250);
  y = drawSectionHeader(page, 'Primary Owner Information', y, helveticaBold, pageWidth);

  y = drawField(page, 'Name', `${applicationData.ownerFirstName} ${applicationData.ownerLastName}`, col1X, y, helvetica, helveticaBold);
  drawField(page, 'Title', applicationData.ownerTitle, col2X, y + 35, helvetica, helveticaBold);

  y = drawField(page, 'Ownership Percentage', `${applicationData.ownershipPercentage}%`, col1X, y, helvetica, helveticaBold);
  drawField(page, 'Social Security Number', formatSSN(applicationData.ownerSSN), col2X, y + 35, helvetica, helveticaBold);

  y = drawField(page, 'Date of Birth', applicationData.ownerDOB, col1X, y, helvetica, helveticaBold);
  drawField(page, 'Cell Phone', maskPhone(applicationData.ownerPhone, applicationData.ownerPhoneCountry), col2X, y + 35, helvetica, helveticaBold);

  y = drawField(page, 'Email', maskEmail(applicationData.ownerEmail), col1X, y, helvetica, helveticaBold);
  drawField(page, "Driver's License", `${applicationData.ownerDriversLicense} (${getStateName(applicationData.ownerDriversLicenseState)})`, col2X, y + 35, helvetica, helveticaBold);

  y = drawField(page, 'Home Address', applicationData.ownerHomeAddress, col1X, y, helvetica, helveticaBold, contentWidth);
  y -= 10;

  // =====================
  // SECOND OWNER (if applicable)
  // =====================
  if (applicationData.hasSecondOwner === 'yes') {
    checkNewPage(250);
    y = drawSectionHeader(page, 'Second Owner Information', y, helveticaBold, pageWidth);

    y = drawField(page, 'Name', `${applicationData.secondOwnerFirstName} ${applicationData.secondOwnerLastName}`, col1X, y, helvetica, helveticaBold);
    drawField(page, 'Title', applicationData.secondOwnerTitle || 'N/A', col2X, y + 35, helvetica, helveticaBold);

    y = drawField(page, 'Ownership Percentage', `${applicationData.secondOwnerOwnershipPercentage}%`, col1X, y, helvetica, helveticaBold);
    drawField(page, 'Social Security Number', formatSSN(applicationData.secondOwnerSSN || ''), col2X, y + 35, helvetica, helveticaBold);

    y = drawField(page, 'Date of Birth', applicationData.secondOwnerDOB || 'N/A', col1X, y, helvetica, helveticaBold);
    drawField(page, 'Cell Phone', maskPhone(applicationData.secondOwnerPhone || '', applicationData.secondOwnerPhoneCountry), col2X, y + 35, helvetica, helveticaBold);

    y = drawField(page, 'Email', maskEmail(applicationData.secondOwnerEmail || ''), col1X, y, helvetica, helveticaBold);
    drawField(page, "Driver's License", `${applicationData.secondOwnerDriversLicense} (${getStateName(applicationData.secondOwnerDriversLicenseState || '')})`, col2X, y + 35, helvetica, helveticaBold);

    y = drawField(page, 'Home Address', applicationData.secondOwnerHomeAddress || 'N/A', col1X, y, helvetica, helveticaBold, contentWidth);
    y -= 10;
  }

  // =====================
  // FINANCIAL INFORMATION
  // =====================
  checkNewPage(150);
  y = drawSectionHeader(page, 'Business Financial Information', y, helveticaBold, pageWidth);

  y = drawField(page, 'Gross Annual Sales', formatCurrency(applicationData.grossAnnualSales), col1X, y, helvetica, helveticaBold);
  drawField(page, 'Average Monthly Revenue', formatCurrency(applicationData.averageMonthlyRevenue), col2X, y + 35, helvetica, helveticaBold);

  y = drawField(page, 'Open Loans/Advances', formatCurrency(applicationData.openLoansAdvances || '0'), col1X, y, helvetica, helveticaBold);
  drawField(page, 'Bankruptcy History', applicationData.hasBankruptcy === 'yes' ? 'Yes' : applicationData.hasBankruptcy === 'no' ? 'No' : 'N/A', col2X, y + 35, helvetica, helveticaBold);
  y -= 10;

  // =====================
  // PROPERTY OWNERSHIP (if any)
  // =====================
  if (applicationData.properties && applicationData.properties.length > 0) {
    checkNewPage(150);
    y = drawSectionHeader(page, 'Property Ownership', y, helveticaBold, pageWidth);

    for (let i = 0; i < applicationData.properties.length; i++) {
      const prop = applicationData.properties[i];
      checkNewPage(180);

      page.drawText(`Property ${i + 1}`, {
        x: col1X,
        y,
        size: 10,
        font: helveticaBold,
        color: rgb(0.06, 0.09, 0.17),
      });
      y -= 20;

      y = drawField(page, 'Address', prop.address || 'N/A', col1X, y, helvetica, helveticaBold, contentWidth);

      y = drawField(page, 'Property Type', getPropertyTypeName(prop.propertyType), col1X, y, helvetica, helveticaBold);
      drawField(page, 'Year Acquired', prop.yearAcquired || 'N/A', col2X, y + 35, helvetica, helveticaBold);

      y = drawField(page, 'Purchase Price', prop.purchasePrice ? formatCurrency(prop.purchasePrice) : 'N/A', col1X, y, helvetica, helveticaBold);
      drawField(page, 'Current Value', prop.currentValue ? formatCurrency(prop.currentValue) : 'N/A', col2X, y + 35, helvetica, helveticaBold);

      y = drawField(page, 'Loan Balance', prop.loanBalance ? formatCurrency(prop.loanBalance) : 'N/A', col1X, y, helvetica, helveticaBold);
      drawField(page, 'Lender', prop.lender || 'N/A', col2X, y + 35, helvetica, helveticaBold);

      y = drawField(page, 'Title Holders', prop.titleHolders || 'N/A', col1X, y, helvetica, helveticaBold, contentWidth);
      y -= 10;
    }
  }

  // =====================
  // BANK STATEMENTS
  // =====================
  if (bankStatementNames.length > 0) {
    checkNewPage(80);
    y = drawSectionHeader(page, 'Bank Statements', y, helveticaBold, pageWidth);

    page.drawText('The following bank statements have been attached:', {
      x: col1X,
      y,
      size: 10,
      font: helvetica,
      color: rgb(0.4, 0.45, 0.55),
    });
    y -= 18;

    for (const name of bankStatementNames) {
      page.drawText(`• ${sanitizeForPDF(name)}`, {
        x: col1X + 10,
        y,
        size: 10,
        font: helvetica,
        color: rgb(0.06, 0.09, 0.17),
      });
      y -= 15;
    }
    y -= 10;
  }

  // =====================
  // SIGNATURES
  // =====================
  checkNewPage(280);
  y = drawSectionHeader(page, 'Authorization & Signatures', y, helveticaBold, pageWidth);

  // Authorization Statement
  const authorizationText = [
    'By signing below, each of the businesses and business owners/officers listed above (individually and collectively, "You") authorize Wholesale',
    'Funding Solutions (WFS), and its representatives, successors, assigns, and designees (collectively, "Recipients"), who may be involved in or acquire',
    'commercial loans with daily repayment features or purchases of future receivables (including but not limited to Merchant Cash Advance',
    'transactions, referred to herein as "Transactions"), to obtain consumer, personal, business, and investigative reports, as well as other',
    'information about You from one or more banks, creditors, credit reporting agencies, or other third parties. This authorization includes the right',
    'to access and review financial records, including but not limited to bank statements and credit card processor statements. WFS is further',
    'authorized to transmit this application, together with any information obtained in connection with it, to any or all Recipients for the purposes',
    'described above.',
    '',
    'You further authorize any creditor or financial institution to release information relating to You directly to WFS and its Principals. You also consent',
    'to receive any legally required notices by electronic mail at the email address provided in this application. In addition, You authorize any lender',
    'or Recipient to contact You by telephone call or text message for marketing purposes at the phone number(s) provided in this application, even',
    'if such number(s) appear on a state, federal, or corporate "Do Not Call" registry.',
    '',
    'By signing this form, You consent to receive SMS messages. Message and data rates may apply. Message frequency may vary based on',
    'interactions between You and our agents. You may opt out at any time by replying STOP, or reply HELP for additional assistance.',
  ];

  for (const line of authorizationText) {
    if (line === '') {
      y -= 6; // Extra spacing for paragraph breaks
    } else {
      page.drawText(line, {
        x: col1X,
        y,
        size: 7.5,
        font: helvetica,
        color: rgb(0.25, 0.25, 0.25),
      });
      y -= 10;
    }
  }
  y -= 15;

  // Primary Owner Signature
  page.drawText('Primary Owner Signature', {
    x: col1X,
    y,
    size: 10,
    font: helveticaBold,
    color: rgb(0.06, 0.09, 0.17),
  });
  y -= 15;

  if (signature) {
    try {
      // Remove data URL prefix if present
      const base64Data = signature.replace(/^data:image\/\w+;base64,/, '');
      const signatureBytes = Buffer.from(base64Data, 'base64');
      const signatureImage = await pdfDoc.embedPng(signatureBytes);

      const sigHeight = 50;
      const sigWidth = (signatureImage.width / signatureImage.height) * sigHeight;

      page.drawImage(signatureImage, {
        x: col1X,
        y: y - sigHeight,
        width: Math.min(sigWidth, 200),
        height: sigHeight,
      });
      y -= sigHeight + 10;
    } catch {
      page.drawText('[Signature on file]', {
        x: col1X,
        y: y - 20,
        size: 10,
        font: helvetica,
        color: rgb(0.4, 0.45, 0.55),
      });
      y -= 40;
    }
  } else {
    page.drawText('[No signature provided]', {
      x: col1X,
      y: y - 20,
      size: 10,
      font: helvetica,
      color: rgb(0.4, 0.45, 0.55),
    });
    y -= 40;
  }

  // Primary owner name and date
  page.drawText(`${sanitizeForPDF(applicationData.ownerFirstName)} ${sanitizeForPDF(applicationData.ownerLastName)} - ${submissionDate}`, {
    x: col1X,
    y,
    size: 9,
    font: helvetica,
    color: rgb(0.4, 0.45, 0.55),
  });
  y -= 30;

  // Second Owner Signature (if applicable)
  if (applicationData.hasSecondOwner === 'yes') {
    checkNewPage(100);

    page.drawText('Second Owner Signature', {
      x: col1X,
      y,
      size: 10,
      font: helveticaBold,
      color: rgb(0.06, 0.09, 0.17),
    });
    y -= 15;

    if (secondSignature) {
      try {
        const base64Data = secondSignature.replace(/^data:image\/\w+;base64,/, '');
        const signatureBytes = Buffer.from(base64Data, 'base64');
        const signatureImage = await pdfDoc.embedPng(signatureBytes);

        const sigHeight = 50;
        const sigWidth = (signatureImage.width / signatureImage.height) * sigHeight;

        page.drawImage(signatureImage, {
          x: col1X,
          y: y - sigHeight,
          width: Math.min(sigWidth, 200),
          height: sigHeight,
        });
        y -= sigHeight + 10;
      } catch {
        page.drawText('[Signature on file]', {
          x: col1X,
          y: y - 20,
          size: 10,
          font: helvetica,
          color: rgb(0.4, 0.45, 0.55),
        });
        y -= 40;
      }
    } else {
      page.drawText('[No signature provided]', {
        x: col1X,
        y: y - 20,
        size: 10,
        font: helvetica,
        color: rgb(0.4, 0.45, 0.55),
      });
      y -= 40;
    }

    // Second owner name and date
    page.drawText(`${sanitizeForPDF(applicationData.secondOwnerFirstName || '')} ${sanitizeForPDF(applicationData.secondOwnerLastName || '')} - ${submissionDate}`, {
      x: col1X,
      y,
      size: 9,
      font: helvetica,
      color: rgb(0.4, 0.45, 0.55),
    });
    y -= 30;
  }

  // =====================
  // FOOTER
  // =====================
  checkNewPage(60);

  // Draw footer line
  page.drawLine({
    start: { x: margin, y: y },
    end: { x: pageWidth - margin, y: y },
    thickness: 0.5,
    color: rgb(0.8, 0.8, 0.8),
  });
  y -= 20;

  const footerText1 = 'Wholesale Funding Solutions | Direct Business Capital';
  const footer1Width = helvetica.widthOfTextAtSize(footerText1, 9);
  page.drawText(footerText1, {
    x: (pageWidth - footer1Width) / 2,
    y,
    size: 9,
    font: helvetica,
    color: rgb(0.4, 0.45, 0.55),
  });
  y -= 12;

  const footerText2 = `This application was submitted electronically on ${submissionDate}`;
  const footer2Width = helvetica.widthOfTextAtSize(footerText2, 8);
  page.drawText(footerText2, {
    x: (pageWidth - footer2Width) / 2,
    y,
    size: 8,
    font: helvetica,
    color: rgb(0.5, 0.5, 0.5),
  });

  // Serialize the PDF to bytes
  const pdfBytes = await pdfDoc.save();

  return Buffer.from(pdfBytes);
}
