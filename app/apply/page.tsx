'use client';

import { useState, useRef, useCallback } from 'react';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import * as Sentry from '@sentry/nextjs';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import SignatureCanvas from 'react-signature-canvas';
import {
  PlusIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
  DocumentArrowUpIcon,
  CheckCircleIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

import AddressAutocomplete from '../components/AddressAutocomplete';

// US States list
const US_STATES = [
  { value: '', label: 'Select State' },
  { value: 'AL', label: 'Alabama' }, { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' }, { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' }, { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' }, { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' }, { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' }, { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' }, { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' }, { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' }, { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' }, { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' }, { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' }, { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' }, { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' }, { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' }, { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' }, { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' }, { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' }, { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' }, { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' }, { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' }, { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' }, { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' }, { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' }, { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' }, { value: 'WY', label: 'Wyoming' },
  { value: 'DC', label: 'District of Columbia' },
];

// Country codes for phone
const COUNTRY_CODES = [
  { code: '+1', country: 'US/CA', flag: '🇺🇸' },
  { code: '+44', country: 'UK', flag: '🇬🇧' },
  { code: '+61', country: 'AU', flag: '🇦🇺' },
  { code: '+49', country: 'DE', flag: '🇩🇪' },
  { code: '+33', country: 'FR', flag: '🇫🇷' },
  { code: '+81', country: 'JP', flag: '🇯🇵' },
  { code: '+86', country: 'CN', flag: '🇨🇳' },
  { code: '+91', country: 'IN', flag: '🇮🇳' },
  { code: '+52', country: 'MX', flag: '🇲🇽' },
  { code: '+55', country: 'BR', flag: '🇧🇷' },
];

// Business legal structures
const LEGAL_STRUCTURES = [
  { value: '', label: 'Select Structure' },
  { value: 'sole_proprietorship', label: 'Sole Proprietorship' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'llc', label: 'Limited Liability Company (LLC)' },
  { value: 'llp', label: 'Limited Liability Partnership (LLP)' },
  { value: 'corporation', label: 'Corporation (C-Corp)' },
  { value: 's_corporation', label: 'S Corporation (S-Corp)' },
  { value: 'nonprofit', label: 'Non-Profit Organization' },
  { value: 'cooperative', label: 'Cooperative' },
  { value: 'professional_corporation', label: 'Professional Corporation (PC)' },
  { value: 'benefit_corporation', label: 'Benefit Corporation (B-Corp)' },
];

// Step definitions
const STEPS = [
  { id: 1, title: 'Funding Request', shortTitle: 'Funding' },
  { id: 2, title: 'Business Information', shortTitle: 'Business' },
  { id: 3, title: 'Primary Owner', shortTitle: 'Owner' },
  { id: 4, title: 'Additional Owners', shortTitle: 'Co-Owners' },
  { id: 5, title: 'Financial Details', shortTitle: 'Financials' },
  { id: 6, title: 'Property Ownership', shortTitle: 'Property' },
  { id: 7, title: 'Bank Statements', shortTitle: 'Documents' },
  { id: 8, title: 'Review & Sign', shortTitle: 'Sign' },
];

interface Property {
  id: string;
  address: string;
  propertyType: string;
  yearAcquired: string;
  purchasePrice: string;
  currentValue: string;
  loanBalance: string;
  lender: string;
  titleHolders: string;
}

interface FormData {
  fundingSpecialistName: string;
  amountRequested: string;
  useOfFunds: string;
  legalBusinessName: string;
  dba: string;
  businessAddress: string;
  businessPhone: string;
  businessPhoneCountry: string;
  businessStartDate: string;
  legalStructure: string;
  stateOfIncorporation: string;
  federalTaxId: string;
  industry: string;
  website: string;
  ownerFirstName: string;
  ownerLastName: string;
  ownerTitle: string;
  ownershipPercentage: string;
  ownerHomeAddress: string;
  ownerSSN: string;
  ownerDOB: string;
  ownerPhone: string;
  ownerPhoneCountry: string;
  ownerEmail: string;
  ownerDriversLicense: string;
  ownerDriversLicenseState: string;
  hasSecondOwner: 'yes' | 'no' | '';
  secondOwnerFirstName: string;
  secondOwnerLastName: string;
  secondOwnerTitle: string;
  secondOwnerOwnershipPercentage: string;
  secondOwnerHomeAddress: string;
  secondOwnerSSN: string;
  secondOwnerDOB: string;
  secondOwnerPhone: string;
  secondOwnerPhoneCountry: string;
  secondOwnerEmail: string;
  secondOwnerDriversLicense: string;
  secondOwnerDriversLicenseState: string;
  grossAnnualSales: string;
  averageMonthlyRevenue: string;
  openLoansAdvances: string;
  hasBankruptcy: 'yes' | 'no' | '';
  properties: Property[];
}

const initialFormData: FormData = {
  fundingSpecialistName: '',
  amountRequested: '',
  useOfFunds: '',
  legalBusinessName: '',
  dba: '',
  businessAddress: '',
  businessPhone: '',
  businessPhoneCountry: '+1',
  businessStartDate: '',
  legalStructure: '',
  stateOfIncorporation: '',
  federalTaxId: '',
  industry: '',
  website: '',
  ownerFirstName: '',
  ownerLastName: '',
  ownerTitle: '',
  ownershipPercentage: '',
  ownerHomeAddress: '',
  ownerSSN: '',
  ownerDOB: '',
  ownerPhone: '',
  ownerPhoneCountry: '+1',
  ownerEmail: '',
  ownerDriversLicense: '',
  ownerDriversLicenseState: '',
  hasSecondOwner: '',
  secondOwnerFirstName: '',
  secondOwnerLastName: '',
  secondOwnerTitle: '',
  secondOwnerOwnershipPercentage: '',
  secondOwnerHomeAddress: '',
  secondOwnerSSN: '',
  secondOwnerDOB: '',
  secondOwnerPhone: '',
  secondOwnerPhoneCountry: '+1',
  secondOwnerEmail: '',
  secondOwnerDriversLicense: '',
  secondOwnerDriversLicenseState: '',
  grossAnnualSales: '',
  averageMonthlyRevenue: '',
  openLoansAdvances: '',
  hasBankruptcy: '',
  properties: [],
};

// Formatting helpers
const formatPhoneNumber = (value: string): string => {
  const numbers = value.replace(/\D/g, '');
  if (numbers.length <= 3) return numbers;
  if (numbers.length <= 6) return `(${numbers.slice(0, 3)}) ${numbers.slice(3)}`;
  return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`;
};

const formatSSN = (value: string, show: boolean): string => {
  const numbers = value.replace(/\D/g, '');
  if (show) {
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 5) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 5)}-${numbers.slice(5, 9)}`;
  } else {
    if (numbers.length <= 3) return '•'.repeat(numbers.length);
    if (numbers.length <= 5) return `•••-${'•'.repeat(numbers.length - 3)}`;
    return `•••-••-${numbers.slice(5, 9) || '•'.repeat(Math.min(4, numbers.length - 5))}`;
  }
};

const formatEIN = (value: string): string => {
  const numbers = value.replace(/\D/g, '');
  if (numbers.length <= 2) return numbers;
  return `${numbers.slice(0, 2)}-${numbers.slice(2, 9)}`;
};

const formatCurrency = (value: string): string => {
  const numbers = value.replace(/\D/g, '');
  if (!numbers) return '';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(parseInt(numbers));
};

const getLegalStructureName = (value: string): string => {
  const found = LEGAL_STRUCTURES.find(s => s.value === value);
  return found ? found.label : value;
};

const getStateName = (code: string): string => {
  const found = US_STATES.find(s => s.value === code);
  return found ? found.label : code;
};

// Driver's License validation patterns by state
// Verified against official DMV documentation
interface DLPattern {
  pattern: RegExp;
  description: string;
  placeholder: string;
  maxLength: number;
  firstCharRule: 'letter' | 'digit' | 'either'; // What the first character must be
  allowedChars: RegExp; // What characters are allowed as you type
}

const DL_PATTERNS: Record<string, DLPattern> = {
  // Alabama: 7-8 digits only
  AL: { pattern: /^\d{7,8}$/, description: '7-8 digits', placeholder: '1234567', maxLength: 8, firstCharRule: 'digit', allowedChars: /^\d+$/ },
  // Alaska: 1-7 digits only
  AK: { pattern: /^\d{1,7}$/, description: '1-7 digits', placeholder: '1234567', maxLength: 7, firstCharRule: 'digit', allowedChars: /^\d+$/ },
  // Arizona: 1 letter + 8 digits, OR 9 digits (SSN-based legacy)
  AZ: { pattern: /^[A-Z]\d{8}$|^\d{9}$/, description: '1 letter + 8 digits, or 9 digits', placeholder: 'D12345678', maxLength: 9, firstCharRule: 'either', allowedChars: /^[A-Z]?\d*$/ },
  // Arkansas: 4-9 digits only
  AR: { pattern: /^\d{4,9}$/, description: '4-9 digits', placeholder: '123456789', maxLength: 9, firstCharRule: 'digit', allowedChars: /^\d+$/ },
  // California: Always 1 letter + 7 digits
  CA: { pattern: /^[A-Z]\d{7}$/, description: '1 letter + 7 digits', placeholder: 'D1234567', maxLength: 8, firstCharRule: 'letter', allowedChars: /^[A-Z]?\d*$/ },
  // Colorado: 9 digits OR 2 letters + 3-6 digits
  CO: { pattern: /^\d{9}$|^[A-Z]{2}\d{3,6}$/, description: '9 digits, or 2 letters + 3-6 digits', placeholder: '123456789', maxLength: 9, firstCharRule: 'either', allowedChars: /^[A-Z0-9]*$/ },
  // Connecticut: 9 digits only
  CT: { pattern: /^\d{9}$/, description: '9 digits', placeholder: '123456789', maxLength: 9, firstCharRule: 'digit', allowedChars: /^\d+$/ },
  // Delaware: 1-7 digits only
  DE: { pattern: /^\d{1,7}$/, description: '1-7 digits', placeholder: '1234567', maxLength: 7, firstCharRule: 'digit', allowedChars: /^\d+$/ },
  // DC: 7-9 digits only
  DC: { pattern: /^\d{7,9}$/, description: '7-9 digits', placeholder: '1234567', maxLength: 9, firstCharRule: 'digit', allowedChars: /^\d+$/ },
  // Florida: Always 1 letter + 12 digits
  FL: { pattern: /^[A-Z]\d{12}$/, description: '1 letter + 12 digits', placeholder: 'D123456789012', maxLength: 13, firstCharRule: 'letter', allowedChars: /^[A-Z]?\d*$/ },
  // Georgia: 7-9 digits only
  GA: { pattern: /^\d{7,9}$/, description: '7-9 digits', placeholder: '123456789', maxLength: 9, firstCharRule: 'digit', allowedChars: /^\d+$/ },
  // Hawaii: H + 8 digits OR 9 digits
  HI: { pattern: /^H\d{8}$|^\d{9}$/, description: 'H + 8 digits, or 9 digits', placeholder: 'H12345678', maxLength: 9, firstCharRule: 'either', allowedChars: /^[H]?\d*$/ },
  // Idaho: 2 letters + 6 digits + 1 letter, OR 9 digits
  ID: { pattern: /^[A-Z]{2}\d{6}[A-Z]$|^\d{9}$/, description: '2 letters + 6 digits + 1 letter, or 9 digits', placeholder: 'AB123456C', maxLength: 9, firstCharRule: 'either', allowedChars: /^[A-Z0-9]*$/ },
  // Illinois: Always 1 letter + 11-12 digits
  IL: { pattern: /^[A-Z]\d{11,12}$/, description: '1 letter + 11-12 digits', placeholder: 'D12345678901', maxLength: 13, firstCharRule: 'letter', allowedChars: /^[A-Z]?\d*$/ },
  // Indiana: 1 letter + 9 digits OR 9-10 digits
  IN: { pattern: /^[A-Z]\d{9}$|^\d{9,10}$/, description: '1 letter + 9 digits, or 9-10 digits', placeholder: '1234567890', maxLength: 10, firstCharRule: 'either', allowedChars: /^[A-Z]?\d*$/ },
  // Iowa: 9 digits OR 3 digits + 2 letters + 4 digits
  IA: { pattern: /^\d{9}$|^\d{3}[A-Z]{2}\d{4}$/, description: '9 digits, or 3 digits + 2 letters + 4 digits', placeholder: '123AB4567', maxLength: 9, firstCharRule: 'digit', allowedChars: /^[\dA-Z]+$/ },
  // Kansas: 1 letter + 8 digits OR 9 digits
  KS: { pattern: /^[A-Z]\d{8}$|^\d{9}$/, description: '1 letter + 8 digits, or 9 digits', placeholder: 'K12345678', maxLength: 9, firstCharRule: 'either', allowedChars: /^[A-Z]?\d*$/ },
  // Kentucky: 1 letter + 8-9 digits OR 9 digits
  KY: { pattern: /^[A-Z]\d{8,9}$|^\d{9}$/, description: '1 letter + 8-9 digits, or 9 digits', placeholder: 'D12345678', maxLength: 10, firstCharRule: 'either', allowedChars: /^[A-Z]?\d*$/ },
  // Louisiana: 9 digits (starts with 00 or 01)
  LA: { pattern: /^0[01]\d{7}$/, description: '9 digits (starts with 00 or 01)', placeholder: '001234567', maxLength: 9, firstCharRule: 'digit', allowedChars: /^\d+$/ },
  // Maine: 7 digits + optional letter
  ME: { pattern: /^\d{7}[A-Z]?$/, description: '7 digits + optional letter', placeholder: '1234567', maxLength: 8, firstCharRule: 'digit', allowedChars: /^\d+[A-Z]?$/ },
  // Maryland: Always 1 letter + 12 digits
  MD: { pattern: /^[A-Z]\d{12}$/, description: '1 letter + 12 digits', placeholder: 'D123456789012', maxLength: 13, firstCharRule: 'letter', allowedChars: /^[A-Z]?\d*$/ },
  // Massachusetts: S + 8 digits OR 9 digits
  MA: { pattern: /^S\d{8}$|^\d{9}$/, description: 'S + 8 digits, or 9 digits', placeholder: 'S12345678', maxLength: 9, firstCharRule: 'either', allowedChars: /^[S]?\d*$/ },
  // Michigan: Always 1 letter + 10-12 digits
  MI: { pattern: /^[A-Z]\d{10,12}$/, description: '1 letter + 10-12 digits', placeholder: 'D1234567890', maxLength: 13, firstCharRule: 'letter', allowedChars: /^[A-Z]?\d*$/ },
  // Minnesota: Always 1 letter + 12 digits
  MN: { pattern: /^[A-Z]\d{12}$/, description: '1 letter + 12 digits', placeholder: 'D123456789012', maxLength: 13, firstCharRule: 'letter', allowedChars: /^[A-Z]?\d*$/ },
  // Mississippi: 9 digits only
  MS: { pattern: /^\d{9}$/, description: '9 digits', placeholder: '123456789', maxLength: 9, firstCharRule: 'digit', allowedChars: /^\d+$/ },
  // Missouri: 1 letter + 5-9 digits OR 9 digits
  MO: { pattern: /^[A-Z]\d{5,9}$|^\d{9}$/, description: '1 letter + 5-9 digits, or 9 digits', placeholder: 'D123456789', maxLength: 10, firstCharRule: 'either', allowedChars: /^[A-Z]?\d*$/ },
  // Montana: 1 letter + 8 digits OR 9-13 digits
  MT: { pattern: /^[A-Z]\d{8}$|^\d{9,13}$/, description: '1 letter + 8 digits, or 9-13 digits', placeholder: '123456789', maxLength: 13, firstCharRule: 'either', allowedChars: /^[A-Z]?\d*$/ },
  // Nebraska: Always 1 letter + 6-8 digits
  NE: { pattern: /^[A-Z]\d{6,8}$/, description: '1 letter + 6-8 digits', placeholder: 'D1234567', maxLength: 9, firstCharRule: 'letter', allowedChars: /^[A-Z]?\d*$/ },
  // Nevada: 9-10 digits OR 12 digits OR X + 8 digits
  NV: { pattern: /^\d{9,10}$|^\d{12}$|^X\d{8}$/, description: '9-12 digits, or X + 8 digits', placeholder: '1234567890', maxLength: 12, firstCharRule: 'either', allowedChars: /^[X]?\d*$/ },
  // New Hampshire: 2 digits + 3 letters + 5 digits
  NH: { pattern: /^\d{2}[A-Z]{3}\d{5}$/, description: '2 digits + 3 letters + 5 digits', placeholder: '12ABC34567', maxLength: 10, firstCharRule: 'digit', allowedChars: /^[\dA-Z]+$/ },
  // New Jersey: Always 1 letter + 14 digits
  NJ: { pattern: /^[A-Z]\d{14}$/, description: '1 letter + 14 digits', placeholder: 'D12345678901234', maxLength: 15, firstCharRule: 'letter', allowedChars: /^[A-Z]?\d*$/ },
  // New Mexico: 8-9 digits only
  NM: { pattern: /^\d{8,9}$/, description: '8-9 digits', placeholder: '123456789', maxLength: 9, firstCharRule: 'digit', allowedChars: /^\d+$/ },
  // New York: 1 letter + 7 digits OR 8-9 digits OR 16 digits
  NY: { pattern: /^[A-Z]\d{7}$|^\d{8,9}$|^\d{16}$/, description: '1 letter + 7 digits, or 8-9 or 16 digits', placeholder: 'D1234567', maxLength: 16, firstCharRule: 'either', allowedChars: /^[A-Z]?\d*$/ },
  // North Carolina: 1-12 digits only
  NC: { pattern: /^\d{1,12}$/, description: '1-12 digits', placeholder: '123456789012', maxLength: 12, firstCharRule: 'digit', allowedChars: /^\d+$/ },
  // North Dakota: 3 letters + 6 digits OR 9 digits
  ND: { pattern: /^[A-Z]{3}\d{6}$|^\d{9}$/, description: '3 letters + 6 digits, or 9 digits', placeholder: 'ABC123456', maxLength: 9, firstCharRule: 'either', allowedChars: /^[A-Z]*\d*$/ },
  // Ohio: 2 letters + 6 digits OR 1 letter + 4-8 digits OR 8 digits
  OH: { pattern: /^[A-Z]{2}\d{6}$|^[A-Z]\d{4,8}$|^\d{8}$/, description: '2 letters + 6 digits, 1 letter + 4-8 digits, or 8 digits', placeholder: 'AB123456', maxLength: 8, firstCharRule: 'either', allowedChars: /^[A-Z]*\d*$/ },
  // Oklahoma: 1 letter + 9 digits OR 9 digits
  OK: { pattern: /^[A-Z]\d{9}$|^\d{9}$/, description: '1 letter + 9 digits, or 9 digits', placeholder: 'D123456789', maxLength: 10, firstCharRule: 'either', allowedChars: /^[A-Z]?\d*$/ },
  // Oregon: 1-9 digits OR 1 letter + 6 digits + optional letter
  OR: { pattern: /^\d{1,9}$|^[A-Z]\d{6}[A-Z]?$/, description: '1-9 digits, or 1 letter + 6 digits', placeholder: '123456789', maxLength: 9, firstCharRule: 'either', allowedChars: /^[A-Z]?\d*[A-Z]?$/ },
  // Pennsylvania: 8 digits only
  PA: { pattern: /^\d{8}$/, description: '8 digits', placeholder: '12345678', maxLength: 8, firstCharRule: 'digit', allowedChars: /^\d+$/ },
  // Rhode Island: 7 digits OR V + 6 digits
  RI: { pattern: /^\d{7}$|^V\d{6}$/, description: '7 digits, or V + 6 digits', placeholder: '1234567', maxLength: 7, firstCharRule: 'either', allowedChars: /^[V]?\d*$/ },
  // South Carolina: 5-11 digits only
  SC: { pattern: /^\d{5,11}$/, description: '5-11 digits', placeholder: '12345678', maxLength: 11, firstCharRule: 'digit', allowedChars: /^\d+$/ },
  // South Dakota: 6-10 or 12 digits only
  SD: { pattern: /^\d{6,10}$|^\d{12}$/, description: '6-10 or 12 digits', placeholder: '12345678', maxLength: 12, firstCharRule: 'digit', allowedChars: /^\d+$/ },
  // Tennessee: 7-9 digits only
  TN: { pattern: /^\d{7,9}$/, description: '7-9 digits', placeholder: '123456789', maxLength: 9, firstCharRule: 'digit', allowedChars: /^\d+$/ },
  // Texas: 7-8 digits only
  TX: { pattern: /^\d{7,8}$/, description: '7-8 digits', placeholder: '12345678', maxLength: 8, firstCharRule: 'digit', allowedChars: /^\d+$/ },
  // Utah: 4-10 digits only
  UT: { pattern: /^\d{4,10}$/, description: '4-10 digits', placeholder: '123456789', maxLength: 10, firstCharRule: 'digit', allowedChars: /^\d+$/ },
  // Vermont: 8 digits OR 7 digits + A
  VT: { pattern: /^\d{8}$|^\d{7}A$/, description: '8 digits, or 7 digits + A', placeholder: '12345678', maxLength: 8, firstCharRule: 'digit', allowedChars: /^\d+A?$/ },
  // Virginia: 1 letter + 8-11 digits OR 9 digits
  VA: { pattern: /^[A-Z]\d{8,11}$|^\d{9}$/, description: '1 letter + 8-11 digits, or 9 digits', placeholder: 'D12345678', maxLength: 12, firstCharRule: 'either', allowedChars: /^[A-Z]?\d*$/ },
  // Washington: First 5 chars of last name + first/middle + more (complex - just validate length)
  WA: { pattern: /^[A-Z0-9*]{12}$/, description: '12 characters (letters, digits, *)', placeholder: 'SMITHJA123BC', maxLength: 12, firstCharRule: 'letter', allowedChars: /^[A-Z0-9*]+$/ },
  // West Virginia: 7 digits OR 1-2 letters + 5-6 digits
  WV: { pattern: /^\d{7}$|^[A-Z]{1,2}\d{5,6}$/, description: '7 digits, or 1-2 letters + 5-6 digits', placeholder: '1234567', maxLength: 8, firstCharRule: 'either', allowedChars: /^[A-Z]*\d*$/ },
  // Wisconsin: Always 1 letter + 13 digits
  WI: { pattern: /^[A-Z]\d{13}$/, description: '1 letter + 13 digits', placeholder: 'D1234567890123', maxLength: 14, firstCharRule: 'letter', allowedChars: /^[A-Z]?\d*$/ },
  // Wyoming: 9-10 digits only
  WY: { pattern: /^\d{9,10}$/, description: '9-10 digits', placeholder: '123456789', maxLength: 10, firstCharRule: 'digit', allowedChars: /^\d+$/ },
};

const validateDriversLicense = (license: string, state: string): { valid: boolean; message: string } => {
  if (!license || !state) {
    return { valid: false, message: 'License number and state are required' };
  }

  const pattern = DL_PATTERNS[state];
  if (!pattern) {
    // If no pattern defined for state, just check it's not empty and reasonable length
    return license.length >= 4 && license.length <= 20
      ? { valid: true, message: '' }
      : { valid: false, message: 'License number should be 4-20 characters' };
  }

  if (pattern.pattern.test(license)) {
    return { valid: true, message: '' };
  }

  return { valid: false, message: `Invalid format for ${getStateName(state)}. Expected: ${pattern.description}` };
};

export default function ApplyPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [rawSSN, setRawSSN] = useState('');
  const [rawSecondSSN, setRawSecondSSN] = useState('');
  const [showSSN, setShowSSN] = useState(false);
  const [showSecondSSN, setShowSecondSSN] = useState(false);
  const [bankStatements, setBankStatements] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [stepErrors, setStepErrors] = useState<{[key: number]: string[]}>({});
  const [dlWarning, setDlWarning] = useState('');
  const [secondDlWarning, setSecondDlWarning] = useState('');

  const signatureRef = useRef<SignatureCanvas>(null);
  const secondSignatureRef = useRef<SignatureCanvas>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { executeRecaptcha } = useGoogleReCaptcha();

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePhoneChange = (field: 'businessPhone' | 'ownerPhone' | 'secondOwnerPhone', value: string) => {
    const formatted = formatPhoneNumber(value);
    setFormData(prev => ({ ...prev, [field]: formatted }));
  };

  const handleSSNKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, isSecondOwner: boolean = false) => {
    const currentRaw = isSecondOwner ? rawSecondSSN : rawSSN;

    // Handle backspace
    if (e.key === 'Backspace') {
      e.preventDefault();
      const newValue = currentRaw.slice(0, -1);
      if (isSecondOwner) {
        setRawSecondSSN(newValue);
        setFormData(prev => ({ ...prev, secondOwnerSSN: newValue }));
      } else {
        setRawSSN(newValue);
        setFormData(prev => ({ ...prev, ownerSSN: newValue }));
      }
      return;
    }

    // Handle number input
    if (/^\d$/.test(e.key) && currentRaw.length < 9) {
      e.preventDefault();
      const newValue = currentRaw + e.key;
      if (isSecondOwner) {
        setRawSecondSSN(newValue);
        setFormData(prev => ({ ...prev, secondOwnerSSN: newValue }));
      } else {
        setRawSSN(newValue);
        setFormData(prev => ({ ...prev, ownerSSN: newValue }));
      }
      return;
    }

    // Allow tab, arrow keys, etc.
    if (!['Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) {
      e.preventDefault();
    }
  };

  const handleCurrencyChange = (field: 'amountRequested' | 'grossAnnualSales' | 'averageMonthlyRevenue' | 'openLoansAdvances', value: string) => {
    const numbers = value.replace(/\D/g, '');
    setFormData(prev => ({ ...prev, [field]: numbers }));
  };

  const handleEINChange = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 9);
    setFormData(prev => ({ ...prev, federalTaxId: numbers }));
  };

  const handleDriversLicenseChange = (
    value: string,
    stateCode: string,
    isSecondOwner: boolean = false
  ) => {
    const upperValue = value.toUpperCase();
    const setWarning = isSecondOwner ? setSecondDlWarning : setDlWarning;
    const licenseField = isSecondOwner ? 'secondOwnerDriversLicense' : 'ownerDriversLicense';

    // If no state selected, just allow input but show a reminder
    if (!stateCode) {
      setWarning('Please select a state first');
      setFormData(prev => ({ ...prev, [licenseField]: upperValue }));
      return;
    }

    const pattern = DL_PATTERNS[stateCode];
    if (!pattern) {
      // Unknown state, allow any input
      setWarning('');
      setFormData(prev => ({ ...prev, [licenseField]: upperValue }));
      return;
    }

    // Check if we've reached max length
    if (upperValue.length > pattern.maxLength) {
      setWarning(`Maximum ${pattern.maxLength} characters for ${getStateName(stateCode)}`);
      return; // Don't update - at max length
    }

    // Check first character rules
    if (upperValue.length === 1) {
      const firstChar = upperValue[0];
      const isLetter = /[A-Z]/.test(firstChar);
      const isDigit = /\d/.test(firstChar);

      if (pattern.firstCharRule === 'letter' && !isLetter) {
        setWarning(`${getStateName(stateCode)} licenses must start with a letter`);
        return; // Don't allow
      }

      if (pattern.firstCharRule === 'digit' && !isDigit) {
        setWarning(`${getStateName(stateCode)} licenses must start with a number`);
        return; // Don't allow
      }
      // 'either' allows both letters and digits
    }

    // Check if the character pattern is valid for this state
    if (upperValue.length > 0 && !pattern.allowedChars.test(upperValue)) {
      // Find what the last character was
      const lastChar = upperValue[upperValue.length - 1];
      const isLetter = /[A-Z]/.test(lastChar);

      if (isLetter) {
        setWarning(`Letters not allowed at this position for ${getStateName(stateCode)}`);
      } else {
        setWarning(`Invalid character for ${getStateName(stateCode)} license format`);
      }
      return; // Don't allow invalid character
    }

    // Clear warning if input is valid so far
    setWarning('');
    setFormData(prev => ({ ...prev, [licenseField]: upperValue }));
  };

  // Clear DL field when state changes
  const handleDLStateChange = (stateCode: string, isSecondOwner: boolean = false) => {
    const licenseField = isSecondOwner ? 'secondOwnerDriversLicense' : 'ownerDriversLicense';
    const stateField = isSecondOwner ? 'secondOwnerDriversLicenseState' : 'ownerDriversLicenseState';
    const setWarning = isSecondOwner ? setSecondDlWarning : setDlWarning;

    setWarning('');
    setFormData(prev => ({
      ...prev,
      [stateField]: stateCode,
      [licenseField]: '', // Clear the license when state changes
    }));
  };

  const addProperty = () => {
    const newProperty: Property = {
      id: Date.now().toString(),
      address: '',
      propertyType: '',
      yearAcquired: '',
      purchasePrice: '',
      currentValue: '',
      loanBalance: '',
      lender: '',
      titleHolders: '',
    };
    setFormData(prev => ({ ...prev, properties: [...prev.properties, newProperty] }));
  };

  const removeProperty = (id: string) => {
    setFormData(prev => ({
      ...prev,
      properties: prev.properties.filter(p => p.id !== id),
    }));
  };

  const updateProperty = (id: string, field: keyof Property, value: string) => {
    setFormData(prev => ({
      ...prev,
      properties: prev.properties.map(p =>
        p.id === id ? { ...p, [field]: value } : p
      ),
    }));
  };

  const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB per file
  const MAX_TOTAL_SIZE = 5 * 1024 * 1024; // 5MB total (Lambda has ~6MB limit)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files).slice(0, 4 - bankStatements.length);

      // Calculate current total size
      const currentTotalSize = bankStatements.reduce((sum, f) => sum + f.size, 0);

      const validFiles: File[] = [];
      const errors: string[] = [];

      for (const file of newFiles) {
        if (file.size > MAX_FILE_SIZE) {
          errors.push(`"${file.name}" is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Please compress your PDF files.`);
          continue;
        }

        const newTotalSize = currentTotalSize + validFiles.reduce((sum, f) => sum + f.size, 0) + file.size;
        if (newTotalSize > MAX_TOTAL_SIZE) {
          errors.push(`Total file size is too large. Please compress your PDF files or upload fewer statements.`);
          continue;
        }

        validFiles.push(file);
      }

      if (errors.length > 0) {
        setSubmitError(errors.join('\n'));
        // Clear error after 8 seconds
        setTimeout(() => setSubmitError(''), 8000);
      }

      if (validFiles.length > 0) {
        setBankStatements(prev => [...prev, ...validFiles].slice(0, 4));
      }
    }
  };

  const removeFile = (index: number) => {
    setBankStatements(prev => prev.filter((_, i) => i !== index));
  };

  const clearSignature = (isSecondOwner: boolean = false) => {
    if (isSecondOwner) {
      secondSignatureRef.current?.clear();
    } else {
      signatureRef.current?.clear();
    }
  };

  // Validation for each step
  const validateStep = (step: number): boolean => {
    const errors: string[] = [];

    switch (step) {
      case 1:
        if (!formData.amountRequested) errors.push('Amount requested is required');
        if (!formData.useOfFunds) errors.push('Use of funds is required');
        break;
      case 2:
        if (!formData.legalBusinessName) errors.push('Legal business name is required');
        if (!formData.businessAddress) errors.push('Business address is required');
        if (!formData.businessPhone) errors.push('Business phone is required');
        if (!formData.businessStartDate) errors.push('Business start date is required');
        if (!formData.legalStructure) errors.push('Legal structure is required');
        if (!formData.stateOfIncorporation) errors.push('State of incorporation is required');
        if (!formData.federalTaxId) errors.push('Federal Tax ID is required');
        if (!formData.industry) errors.push('Industry is required');
        // Website is optional, but validate format if provided
        if (formData.website && formData.website.trim()) {
          const websiteValue = formData.website.trim().toLowerCase();
          // Check for obviously invalid entries
          if (websiteValue === 'n/a' || websiteValue === 'na' || websiteValue === 'none' || websiteValue === '-') {
            // Clear it out - these are acceptable "no website" values
          } else {
            // Add protocol if missing for validation
            const urlToValidate = websiteValue.startsWith('http://') || websiteValue.startsWith('https://')
              ? websiteValue
              : 'https://' + websiteValue;
            try {
              const parsed = new URL(urlToValidate);
              if (!parsed.hostname.includes('.')) {
                errors.push('Website must be a valid URL (e.g., https://www.example.com)');
              }
            } catch {
              errors.push('Website must be a valid URL (e.g., https://www.example.com)');
            }
          }
        }
        break;
      case 3:
        if (!formData.ownerFirstName) errors.push('First name is required');
        if (!formData.ownerLastName) errors.push('Last name is required');
        if (!formData.ownerTitle) errors.push('Title is required');
        if (!formData.ownershipPercentage) errors.push('Ownership percentage is required');
        if (!formData.ownerHomeAddress) errors.push('Home address is required');
        if (!formData.ownerSSN || formData.ownerSSN.length !== 9) errors.push('Valid SSN is required');
        if (!formData.ownerDOB) errors.push('Date of birth is required');
        if (!formData.ownerPhone) errors.push('Phone number is required');
        if (!formData.ownerEmail) errors.push('Email is required');
        // Driver's license is optional, but validate format if provided
        if (formData.ownerDriversLicense && formData.ownerDriversLicenseState) {
          const dlValidation = validateDriversLicense(formData.ownerDriversLicense, formData.ownerDriversLicenseState);
          if (!dlValidation.valid) errors.push(dlValidation.message);
        }
        break;
      case 4:
        if (!formData.hasSecondOwner) errors.push('Please indicate if there is a second owner');
        if (formData.hasSecondOwner === 'yes') {
          if (!formData.secondOwnerFirstName) errors.push('Second owner first name is required');
          if (!formData.secondOwnerLastName) errors.push('Second owner last name is required');
          if (!formData.secondOwnerTitle) errors.push('Second owner title is required');
          if (!formData.secondOwnerOwnershipPercentage) errors.push('Second owner ownership percentage is required');
          if (!formData.secondOwnerHomeAddress) errors.push('Second owner home address is required');
          if (!formData.secondOwnerSSN || formData.secondOwnerSSN.length !== 9) errors.push('Second owner valid SSN is required');
          if (!formData.secondOwnerDOB) errors.push('Second owner date of birth is required');
          if (!formData.secondOwnerPhone) errors.push('Second owner phone is required');
          if (!formData.secondOwnerEmail) errors.push('Second owner email is required');
          // Driver's license is optional, but validate format if provided
          if (formData.secondOwnerDriversLicense && formData.secondOwnerDriversLicenseState) {
            const dlValidation = validateDriversLicense(formData.secondOwnerDriversLicense, formData.secondOwnerDriversLicenseState);
            if (!dlValidation.valid) errors.push(`Second owner: ${dlValidation.message}`);
          }
        }
        break;
      case 5:
        if (!formData.grossAnnualSales) errors.push('Gross annual sales is required');
        if (!formData.averageMonthlyRevenue) errors.push('Average monthly revenue is required');
        if (!formData.openLoansAdvances) errors.push('Open loans or advances is required');
        if (!formData.hasBankruptcy) errors.push('Bankruptcy history is required');
        break;
      case 6:
        // Properties are optional
        break;
      case 7:
        // Bank statements are optional but recommended
        break;
      case 8:
        if (signatureRef.current?.isEmpty()) errors.push('Primary owner signature is required');
        if (formData.hasSecondOwner === 'yes' && secondSignatureRef.current?.isEmpty()) {
          errors.push('Second owner signature is required');
        }
        break;
    }

    setStepErrors(prev => ({ ...prev, [step]: errors }));
    return errors.length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goToStep = (step: number) => {
    // Only allow going back or to completed steps
    if (step < currentStep) {
      setCurrentStep(step);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = useCallback(async () => {
    if (!validateStep(8)) return;

    setIsSubmitting(true);
    setSubmitError('');

    try {
      // Execute reCAPTCHA
      let recaptchaToken = '';
      if (executeRecaptcha) {
        recaptchaToken = await executeRecaptcha('submit_application');
      }

      const signature = signatureRef.current?.isEmpty()
        ? null
        : signatureRef.current?.toDataURL();
      const secondSignature = formData.hasSecondOwner === 'yes' && !secondSignatureRef.current?.isEmpty()
        ? secondSignatureRef.current?.toDataURL()
        : null;

      const submitData = new FormData();
      submitData.append('formData', JSON.stringify(formData));
      submitData.append('signature', signature || '');
      submitData.append('secondSignature', secondSignature || '');
      submitData.append('recaptchaToken', recaptchaToken);
      submitData.append('submissionDate', new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }));

      bankStatements.forEach((file, index) => {
        submitData.append(`bankStatement${index}`, file);
      });

      const totalFileSize = bankStatements.reduce((sum, f) => sum + f.size, 0);

      const response = await fetch('/api/submit-application', {
        method: 'POST',
        body: submitData,
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to submit application');
      }

      setSubmitSuccess(true);
    } catch (error) {
      // Determine error type for better messaging and logging
      const isNetworkError = error instanceof TypeError && error.message.includes('fetch');
      const isTimeoutError = error instanceof Error && error.message.includes('timeout');
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Calculate file info for logging
      const totalFileSize = bankStatements.reduce((sum, f) => sum + f.size, 0);
      const fileNames = bankStatements.map(f => f.name);

      // Report to Sentry with full context
      Sentry.captureException(error, {
        tags: {
          feature: 'application-submit',
          error_type: isNetworkError ? 'network_error' : isTimeoutError ? 'timeout' : 'submission_error',
          client_side: 'true',
        },
        extra: {
          businessName: formData.legalBusinessName,
          contactEmail: formData.ownerEmail,
          contactName: `${formData.ownerFirstName} ${formData.ownerLastName}`,
          contactPhone: `${formData.ownerPhoneCountry} ${formData.ownerPhone}`,
          amountRequested: formData.amountRequested,
          bankStatementCount: bankStatements.length,
          totalFileSize: `${(totalFileSize / 1024 / 1024).toFixed(2)}MB`,
          fileNames,
          errorMessage,
        },
      });

      // Show user-friendly error message
      if (isNetworkError || isTimeoutError) {
        setSubmitError('Unable to submit application. Please check your internet connection and try again. If the problem persists, try compressing your PDF files.');
      } else {
        setSubmitError(errorMessage || 'There was an error submitting your application. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [executeRecaptcha, formData, bankStatements, validateStep]);

  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  if (submitSuccess) {
    return (
      <>
        <div className="pt-32 pb-24 min-h-screen bg-gradient-to-br from-[#f8fafc] to-white">
          <div className="max-w-2xl mx-auto px-6 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8"
            >
              <CheckCircleIcon className="w-12 h-12 text-green-600" />
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-3xl md:text-4xl font-serif text-[#0f172a] mb-4"
            >
              Application Submitted Successfully
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-gray-600 mb-8"
            >
              Thank you for your application. Our team will review your information and contact you within 24-48 business hours.
            </motion.p>
            <motion.a
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              href="/"
              className="inline-block px-8 py-3 bg-[#2aafab] text-white font-medium rounded hover:bg-[#238e8b] transition-colors"
            >
              Return to Home
            </motion.a>
          </div>
        </div>
      </>
    );
  }

  // Input class helper
  const inputClass = "w-full min-h-[44px] px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#2aafab]/20 focus:border-[#2aafab] transition-colors";
  const selectClass = "w-full min-h-[44px] px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#2aafab]/20 focus:border-[#2aafab] transition-colors bg-white";
  const labelClass = "block text-sm font-medium text-gray-700 mb-2";

  return (
    <>
      <div className="pt-24 pb-16 bg-gradient-to-br from-[#f8fafc] to-white min-h-screen">
        <div className="max-w-3xl mx-auto px-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <Link href="/">
              <Image
                src="/logo.png"
                alt="Wholesale Funding Solutions"
                width={200}
                height={50}
                className="h-14 w-auto mx-auto mb-4"
              />
            </Link>
            <h1 className="text-2xl md:text-3xl font-serif text-[#0f172a] mb-2">
              Business Funding Application
            </h1>
          </motion.div>

          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              {STEPS.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <button
                    onClick={() => goToStep(step.id)}
                    disabled={step.id > currentStep}
                    className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all
                      ${step.id < currentStep
                        ? 'bg-[#2aafab] text-white cursor-pointer hover:bg-[#238e8b]'
                        : step.id === currentStep
                          ? 'bg-[#0f172a] text-white'
                          : 'bg-gray-200 text-gray-500 cursor-not-allowed'}
                    `}
                  >
                    {step.id < currentStep ? '✓' : step.id}
                  </button>
                  {index < STEPS.length - 1 && (
                    <div
                      className={`h-1 w-4 md:w-8 lg:w-12 mx-1 rounded ${
                        step.id < currentStep ? 'bg-[#2aafab]' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs text-gray-500 px-1">
              {STEPS.map((step) => (
                <span
                  key={step.id}
                  className={`text-center w-12 ${step.id === currentStep ? 'text-[#0f172a] font-medium' : ''}`}
                >
                  {step.shortTitle}
                </span>
              ))}
            </div>
          </div>

          {/* Error Display */}
          {stepErrors[currentStep]?.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg"
            >
              <p className="text-red-700 font-medium mb-2">Please fix the following errors:</p>
              <ul className="list-disc list-inside text-red-600 text-sm space-y-1">
                {stepErrors[currentStep].map((error, i) => (
                  <li key={i}>{error}</li>
                ))}
              </ul>
            </motion.div>
          )}

          {submitError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3"
            >
              <XMarkIcon className="w-5 h-5 text-red-600" />
              <p className="text-red-700">{submitError}</p>
            </motion.div>
          )}

          {/* Form Steps */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8"
            >
              {/* Step 1: Funding Request */}
              {currentStep === 1 && (
                <div>
                  <h2 className="text-xl font-semibold text-[#0f172a] mb-6">
                    {STEPS[0].title}
                  </h2>
                  <div className="space-y-6">
                    <div>
                      <label className={labelClass}>
                        Funding Specialist Name <span className="text-gray-400">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        value={formData.fundingSpecialistName}
                        onChange={(e) => handleInputChange('fundingSpecialistName', e.target.value)}
                        className={inputClass}
                        placeholder="If you were referred by someone"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>
                        Amount Requested <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.amountRequested ? formatCurrency(formData.amountRequested) : ''}
                        onChange={(e) => handleCurrencyChange('amountRequested', e.target.value)}
                        className={inputClass}
                        placeholder="$50,000"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>
                        Use of Funds <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={formData.useOfFunds}
                        onChange={(e) => handleInputChange('useOfFunds', e.target.value)}
                        rows={4}
                        className={`${inputClass} resize-none`}
                        placeholder="Describe how you plan to use the funding (e.g., inventory, equipment, expansion, working capital)"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Business Information */}
              {currentStep === 2 && (
                <div>
                  <h2 className="text-xl font-semibold text-[#0f172a] mb-6">
                    {STEPS[1].title}
                  </h2>
                  <div className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className={labelClass}>
                          Legal Business Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.legalBusinessName}
                          onChange={(e) => handleInputChange('legalBusinessName', e.target.value)}
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>
                          DBA <span className="text-gray-400">(Doing Business As)</span>
                        </label>
                        <input
                          type="text"
                          value={formData.dba}
                          onChange={(e) => handleInputChange('dba', e.target.value)}
                          className={inputClass}
                          placeholder="If different from legal name"
                        />
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>
                        Business Address <span className="text-red-500">*</span>
                      </label>
                      <AddressAutocomplete
                        value={formData.businessAddress}
                        onChange={(address) => handleInputChange('businessAddress', address)}
                        placeholder="Start typing to search..."
                      />
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className={labelClass}>
                          Business Phone <span className="text-red-500">*</span>
                        </label>
                        <div className="flex gap-2">
                          <select
                            value={formData.businessPhoneCountry}
                            onChange={(e) => handleInputChange('businessPhoneCountry', e.target.value)}
                            className="px-3 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#2aafab]/20 focus:border-[#2aafab] bg-white"
                          >
                            {COUNTRY_CODES.map((c) => (
                              <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
                            ))}
                          </select>
                          <input
                            type="tel"
                            value={formData.businessPhone}
                            onChange={(e) => handlePhoneChange('businessPhone', e.target.value)}
                            className={`flex-1 ${inputClass}`}
                            placeholder="(555) 555-5555"
                          />
                        </div>
                      </div>
                      <div>
                        <label className={labelClass}>
                          Business Start Date <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          value={formData.businessStartDate}
                          onChange={(e) => handleInputChange('businessStartDate', e.target.value)}
                          onClick={(e) => (e.target as HTMLInputElement).showPicker?.()}
                          className={`${inputClass} cursor-pointer`}
                        />
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className={labelClass}>
                          Legal Structure <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={formData.legalStructure}
                          onChange={(e) => handleInputChange('legalStructure', e.target.value)}
                          className={selectClass}
                        >
                          {LEGAL_STRUCTURES.map((s) => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className={labelClass}>
                          State of Incorporation <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={formData.stateOfIncorporation}
                          onChange={(e) => handleInputChange('stateOfIncorporation', e.target.value)}
                          className={selectClass}
                        >
                          {US_STATES.map((s) => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="md:w-1/2">
                      <label className={labelClass}>
                        Federal Tax ID (EIN) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formatEIN(formData.federalTaxId)}
                        onChange={(e) => handleEINChange(e.target.value)}
                        className={inputClass}
                        placeholder="XX-XXXXXXX"
                      />
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className={labelClass}>
                          Industry <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.industry}
                          onChange={(e) => handleInputChange('industry', e.target.value)}
                          className={inputClass}
                          placeholder="e.g., Construction, Retail, Healthcare"
                        />
                      </div>
                      <div>
                        <label className={labelClass}>
                          Company Website
                        </label>
                        <input
                          type="text"
                          value={formData.website}
                          onChange={(e) => handleInputChange('website', e.target.value)}
                          className={inputClass}
                          placeholder="https://www.example.com"
                        />
                        <p className="mt-1 text-xs text-slate-500">
                          Leave blank if none, or enter full URL (e.g., https://yoursite.com)
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Primary Owner */}
              {currentStep === 3 && (
                <div>
                  <h2 className="text-xl font-semibold text-[#0f172a] mb-6">
                    {STEPS[2].title}
                  </h2>
                  <div className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className={labelClass}>First Name <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          value={formData.ownerFirstName}
                          onChange={(e) => handleInputChange('ownerFirstName', e.target.value)}
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Last Name <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          value={formData.ownerLastName}
                          onChange={(e) => handleInputChange('ownerLastName', e.target.value)}
                          className={inputClass}
                        />
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className={labelClass}>Title <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          value={formData.ownerTitle}
                          onChange={(e) => handleInputChange('ownerTitle', e.target.value)}
                          className={inputClass}
                          placeholder="e.g., CEO, Owner, President"
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Ownership Percentage <span className="text-red-500">*</span></label>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={formData.ownershipPercentage}
                            onChange={(e) => handleInputChange('ownershipPercentage', e.target.value)}
                            className={`${inputClass} pr-8`}
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>Home Address <span className="text-red-500">*</span></label>
                      <AddressAutocomplete
                        value={formData.ownerHomeAddress}
                        onChange={(address) => handleInputChange('ownerHomeAddress', address)}
                        placeholder="Start typing to search..."
                      />
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className={labelClass}>Social Security Number <span className="text-red-500">*</span></label>
                        <div className="relative">
                          <input
                            type="text"
                            value={formatSSN(rawSSN, showSSN)}
                            onKeyDown={(e) => handleSSNKeyDown(e)}
                            onChange={() => {}} // Handled by onKeyDown
                            className={`${inputClass} pr-12`}
                            placeholder="•••-••-••••"
                          />
                          <button
                            type="button"
                            onClick={() => setShowSSN(!showSSN)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                          >
                            {showSSN ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Your SSN is encrypted and stored securely</p>
                      </div>
                      <div>
                        <label className={labelClass}>Date of Birth <span className="text-red-500">*</span></label>
                        <input
                          type="date"
                          value={formData.ownerDOB}
                          onChange={(e) => handleInputChange('ownerDOB', e.target.value)}
                          onClick={(e) => (e.target as HTMLInputElement).showPicker?.()}
                          className={`${inputClass} cursor-pointer`}
                        />
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className={labelClass}>Cell Phone <span className="text-red-500">*</span></label>
                        <div className="flex gap-2">
                          <select
                            value={formData.ownerPhoneCountry}
                            onChange={(e) => handleInputChange('ownerPhoneCountry', e.target.value)}
                            className="px-3 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#2aafab]/20 focus:border-[#2aafab] bg-white"
                          >
                            {COUNTRY_CODES.map((c) => (
                              <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
                            ))}
                          </select>
                          <input
                            type="tel"
                            value={formData.ownerPhone}
                            onChange={(e) => handlePhoneChange('ownerPhone', e.target.value)}
                            className={`flex-1 ${inputClass}`}
                            placeholder="(555) 555-5555"
                          />
                        </div>
                      </div>
                      <div>
                        <label className={labelClass}>Email Address <span className="text-red-500">*</span></label>
                        <input
                          type="email"
                          value={formData.ownerEmail}
                          onChange={(e) => handleInputChange('ownerEmail', e.target.value)}
                          className={inputClass}
                        />
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className={labelClass}>Driver&apos;s License State <span className="text-gray-400">(Optional)</span></label>
                        <select
                          value={formData.ownerDriversLicenseState}
                          onChange={(e) => handleDLStateChange(e.target.value)}
                          className={selectClass}
                        >
                          {US_STATES.map((s) => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className={labelClass}>Driver&apos;s License Number <span className="text-gray-400">(Optional)</span></label>
                        <input
                          type="text"
                          value={formData.ownerDriversLicense}
                          onChange={(e) => handleDriversLicenseChange(e.target.value, formData.ownerDriversLicenseState)}
                          placeholder={formData.ownerDriversLicenseState && DL_PATTERNS[formData.ownerDriversLicenseState]
                            ? DL_PATTERNS[formData.ownerDriversLicenseState].placeholder
                            : 'Select state first'}
                          maxLength={formData.ownerDriversLicenseState && DL_PATTERNS[formData.ownerDriversLicenseState]
                            ? DL_PATTERNS[formData.ownerDriversLicenseState].maxLength
                            : 20}
                          className={`${inputClass} ${dlWarning ? 'border-amber-500 focus:border-amber-500 focus:ring-amber-500/20' : ''}`}
                          disabled={!formData.ownerDriversLicenseState}
                        />
                        {dlWarning && (
                          <p className="mt-1 text-xs text-amber-600 flex items-center gap-1">
                            <span className="inline-block w-4 h-4 rounded-full bg-amber-500 text-white text-center text-xs leading-4">!</span>
                            {dlWarning}
                          </p>
                        )}
                        {!dlWarning && formData.ownerDriversLicenseState && DL_PATTERNS[formData.ownerDriversLicenseState] && (
                          <p className="mt-1 text-xs text-gray-500">
                            Format: {DL_PATTERNS[formData.ownerDriversLicenseState].description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Additional Owners */}
              {currentStep === 4 && (
                <div>
                  <h2 className="text-xl font-semibold text-[#0f172a] mb-6">
                    {STEPS[3].title}
                  </h2>
                  <div className="space-y-6">
                    <div>
                      <label className={labelClass}>
                        Is there a second owner with 20% or more ownership? <span className="text-red-500">*</span>
                      </label>
                      <div className="flex gap-4 mt-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="hasSecondOwner"
                            value="yes"
                            checked={formData.hasSecondOwner === 'yes'}
                            onChange={(e) => handleInputChange('hasSecondOwner', e.target.value as 'yes' | 'no')}
                            className="w-4 h-4 text-[#2aafab] focus:ring-[#2aafab]"
                          />
                          <span className="text-gray-700">Yes</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="hasSecondOwner"
                            value="no"
                            checked={formData.hasSecondOwner === 'no'}
                            onChange={(e) => handleInputChange('hasSecondOwner', e.target.value as 'yes' | 'no')}
                            className="w-4 h-4 text-[#2aafab] focus:ring-[#2aafab]"
                          />
                          <span className="text-gray-700">No</span>
                        </label>
                      </div>
                    </div>

                    {formData.hasSecondOwner === 'yes' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-6 pt-6 border-t border-gray-100"
                      >
                        <h3 className="text-lg font-medium text-gray-900">Second Owner Information</h3>
                        <div className="grid md:grid-cols-2 gap-6">
                          <div>
                            <label className={labelClass}>First Name <span className="text-red-500">*</span></label>
                            <input
                              type="text"
                              value={formData.secondOwnerFirstName}
                              onChange={(e) => handleInputChange('secondOwnerFirstName', e.target.value)}
                              className={inputClass}
                            />
                          </div>
                          <div>
                            <label className={labelClass}>Last Name <span className="text-red-500">*</span></label>
                            <input
                              type="text"
                              value={formData.secondOwnerLastName}
                              onChange={(e) => handleInputChange('secondOwnerLastName', e.target.value)}
                              className={inputClass}
                            />
                          </div>
                        </div>
                        <div className="grid md:grid-cols-2 gap-6">
                          <div>
                            <label className={labelClass}>Title <span className="text-red-500">*</span></label>
                            <input
                              type="text"
                              value={formData.secondOwnerTitle}
                              onChange={(e) => handleInputChange('secondOwnerTitle', e.target.value)}
                              className={inputClass}
                              placeholder="e.g., CEO, Owner, President"
                            />
                          </div>
                          <div>
                            <label className={labelClass}>Ownership Percentage <span className="text-red-500">*</span></label>
                            <div className="relative">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={formData.secondOwnerOwnershipPercentage}
                                onChange={(e) => handleInputChange('secondOwnerOwnershipPercentage', e.target.value)}
                                className={`${inputClass} pr-8`}
                              />
                              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                            </div>
                          </div>
                        </div>
                        <div>
                          <label className={labelClass}>Home Address <span className="text-red-500">*</span></label>
                          <AddressAutocomplete
                            value={formData.secondOwnerHomeAddress}
                            onChange={(address) => handleInputChange('secondOwnerHomeAddress', address)}
                            placeholder="Start typing to search..."
                          />
                        </div>
                        <div className="grid md:grid-cols-2 gap-6">
                          <div>
                            <label className={labelClass}>Social Security Number <span className="text-red-500">*</span></label>
                            <div className="relative">
                              <input
                                type="text"
                                value={formatSSN(rawSecondSSN, showSecondSSN)}
                                onKeyDown={(e) => handleSSNKeyDown(e, true)}
                                onChange={() => {}} // Handled by onKeyDown
                                className={`${inputClass} pr-12`}
                                placeholder="•••-••-••••"
                              />
                              <button
                                type="button"
                                onClick={() => setShowSecondSSN(!showSecondSSN)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                              >
                                {showSecondSSN ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                              </button>
                            </div>
                          </div>
                          <div>
                            <label className={labelClass}>Date of Birth <span className="text-red-500">*</span></label>
                            <input
                              type="date"
                              value={formData.secondOwnerDOB}
                              onChange={(e) => handleInputChange('secondOwnerDOB', e.target.value)}
                              onClick={(e) => (e.target as HTMLInputElement).showPicker?.()}
                              className={`${inputClass} cursor-pointer`}
                            />
                          </div>
                        </div>
                        <div className="grid md:grid-cols-2 gap-6">
                          <div>
                            <label className={labelClass}>Cell Phone <span className="text-red-500">*</span></label>
                            <div className="flex gap-2">
                              <select
                                value={formData.secondOwnerPhoneCountry}
                                onChange={(e) => handleInputChange('secondOwnerPhoneCountry', e.target.value)}
                                className="px-3 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#2aafab]/20 focus:border-[#2aafab] bg-white"
                              >
                                {COUNTRY_CODES.map((c) => (
                                  <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
                                ))}
                              </select>
                              <input
                                type="tel"
                                value={formData.secondOwnerPhone}
                                onChange={(e) => handlePhoneChange('secondOwnerPhone', e.target.value)}
                                className={`flex-1 ${inputClass}`}
                                placeholder="(555) 555-5555"
                              />
                            </div>
                          </div>
                          <div>
                            <label className={labelClass}>Email Address <span className="text-red-500">*</span></label>
                            <input
                              type="email"
                              value={formData.secondOwnerEmail}
                              onChange={(e) => handleInputChange('secondOwnerEmail', e.target.value)}
                              className={inputClass}
                            />
                          </div>
                        </div>
                        <div className="grid md:grid-cols-2 gap-6">
                          <div>
                            <label className={labelClass}>Driver&apos;s License State <span className="text-gray-400">(Optional)</span></label>
                            <select
                              value={formData.secondOwnerDriversLicenseState}
                              onChange={(e) => handleDLStateChange(e.target.value, true)}
                              className={selectClass}
                            >
                              {US_STATES.map((s) => (
                                <option key={s.value} value={s.value}>{s.label}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className={labelClass}>Driver&apos;s License Number <span className="text-gray-400">(Optional)</span></label>
                            <input
                              type="text"
                              value={formData.secondOwnerDriversLicense}
                              onChange={(e) => handleDriversLicenseChange(e.target.value, formData.secondOwnerDriversLicenseState, true)}
                              placeholder={formData.secondOwnerDriversLicenseState && DL_PATTERNS[formData.secondOwnerDriversLicenseState]
                                ? DL_PATTERNS[formData.secondOwnerDriversLicenseState].placeholder
                                : 'Select state first'}
                              maxLength={formData.secondOwnerDriversLicenseState && DL_PATTERNS[formData.secondOwnerDriversLicenseState]
                                ? DL_PATTERNS[formData.secondOwnerDriversLicenseState].maxLength
                                : 20}
                              className={`${inputClass} ${secondDlWarning ? 'border-amber-500 focus:border-amber-500 focus:ring-amber-500/20' : ''}`}
                              disabled={!formData.secondOwnerDriversLicenseState}
                            />
                            {secondDlWarning && (
                              <p className="mt-1 text-xs text-amber-600 flex items-center gap-1">
                                <span className="inline-block w-4 h-4 rounded-full bg-amber-500 text-white text-center text-xs leading-4">!</span>
                                {secondDlWarning}
                              </p>
                            )}
                            {!secondDlWarning && formData.secondOwnerDriversLicenseState && DL_PATTERNS[formData.secondOwnerDriversLicenseState] && (
                              <p className="mt-1 text-xs text-gray-500">
                                Format: {DL_PATTERNS[formData.secondOwnerDriversLicenseState].description}
                              </p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 5: Financial Details */}
              {currentStep === 5 && (
                <div>
                  <h2 className="text-xl font-semibold text-[#0f172a] mb-6">
                    {STEPS[4].title}
                  </h2>
                  <div className="space-y-6">
                    <div>
                      <label className={labelClass}>
                        Gross Annual Sales <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.grossAnnualSales ? formatCurrency(formData.grossAnnualSales) : ''}
                        onChange={(e) => handleCurrencyChange('grossAnnualSales', e.target.value)}
                        className={inputClass}
                        placeholder="$0"
                      />
                      <p className="text-xs text-gray-500 mt-1">Total revenue for the last 12 months</p>
                    </div>
                    <div>
                      <label className={labelClass}>
                        Average Monthly Revenue <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.averageMonthlyRevenue ? formatCurrency(formData.averageMonthlyRevenue) : ''}
                        onChange={(e) => handleCurrencyChange('averageMonthlyRevenue', e.target.value)}
                        className={inputClass}
                        placeholder="$0"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>
                        Open Loans or Advances <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.openLoansAdvances ? formatCurrency(formData.openLoansAdvances) : ''}
                        onChange={(e) => handleCurrencyChange('openLoansAdvances', e.target.value)}
                        className={inputClass}
                        placeholder="$0"
                      />
                      <p className="text-xs text-gray-500 mt-1">Total outstanding balance of all business loans and advances</p>
                    </div>
                    <div>
                      <label className={labelClass}>
                        Has the business ever filed for bankruptcy? <span className="text-red-500">*</span>
                      </label>
                      <div className="flex gap-4 mt-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="hasBankruptcy"
                            value="yes"
                            checked={formData.hasBankruptcy === 'yes'}
                            onChange={(e) => handleInputChange('hasBankruptcy', e.target.value)}
                            className="w-4 h-4 text-[#2aafab] border-gray-300 focus:ring-[#2aafab]"
                          />
                          <span className="text-gray-700">Yes</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="hasBankruptcy"
                            value="no"
                            checked={formData.hasBankruptcy === 'no'}
                            onChange={(e) => handleInputChange('hasBankruptcy', e.target.value)}
                            className="w-4 h-4 text-[#2aafab] border-gray-300 focus:ring-[#2aafab]"
                          />
                          <span className="text-gray-700">No</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 6: Property Ownership */}
              {currentStep === 6 && (
                <div>
                  <h2 className="text-xl font-semibold text-[#0f172a] mb-2">
                    {STEPS[5].title}
                  </h2>
                  <p className="text-gray-500 text-sm mb-6">
                    Optional: Add any real estate properties owned by the business or principals
                  </p>
                  <div className="space-y-6">
                    {formData.properties.length === 0 ? (
                      <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                        <p className="text-gray-500 mb-4">No properties added</p>
                        <button
                          type="button"
                          onClick={addProperty}
                          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#2aafab] border border-[#2aafab] rounded-lg hover:bg-[#2aafab]/5 transition-colors"
                        >
                          <PlusIcon className="w-4 h-4" />
                          Add Property
                        </button>
                      </div>
                    ) : (
                      <>
                        {formData.properties.map((property, index) => (
                          <div key={property.id} className="p-4 border border-gray-200 rounded-lg">
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="font-medium text-gray-900">Property {index + 1}</h3>
                              <button
                                type="button"
                                onClick={() => removeProperty(property.id)}
                                className="p-1 text-red-500 hover:text-red-700 transition-colors"
                              >
                                <TrashIcon className="w-5 h-5" />
                              </button>
                            </div>
                            <div className="space-y-4">
                              <div>
                                <label className={labelClass}>Property Address</label>
                                <AddressAutocomplete
                                  value={property.address}
                                  onChange={(address) => updateProperty(property.id, 'address', address)}
                                  placeholder="Start typing to search..."
                                />
                              </div>
                              <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                  <label className={labelClass}>Property Type</label>
                                  <select
                                    value={property.propertyType}
                                    onChange={(e) => updateProperty(property.id, 'propertyType', e.target.value)}
                                    className={selectClass}
                                  >
                                    <option value="">Select Type</option>
                                    <option value="residential">Residential</option>
                                    <option value="commercial">Commercial</option>
                                    <option value="industrial">Industrial</option>
                                    <option value="land">Land</option>
                                    <option value="mixed_use">Mixed Use</option>
                                  </select>
                                </div>
                                <div>
                                  <label className={labelClass}>Year Acquired</label>
                                  <input
                                    type="number"
                                    min="1900"
                                    max={new Date().getFullYear()}
                                    value={property.yearAcquired}
                                    onChange={(e) => updateProperty(property.id, 'yearAcquired', e.target.value)}
                                    className={inputClass}
                                    placeholder="e.g., 2015"
                                  />
                                </div>
                              </div>
                              <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                  <label className={labelClass}>Purchase Price</label>
                                  <input
                                    type="text"
                                    value={property.purchasePrice ? formatCurrency(property.purchasePrice) : ''}
                                    onChange={(e) => updateProperty(property.id, 'purchasePrice', e.target.value.replace(/\D/g, ''))}
                                    className={inputClass}
                                    placeholder="$0"
                                  />
                                </div>
                                <div>
                                  <label className={labelClass}>Current Value</label>
                                  <input
                                    type="text"
                                    value={property.currentValue ? formatCurrency(property.currentValue) : ''}
                                    onChange={(e) => updateProperty(property.id, 'currentValue', e.target.value.replace(/\D/g, ''))}
                                    className={inputClass}
                                    placeholder="$0"
                                  />
                                </div>
                              </div>
                              <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                  <label className={labelClass}>Loan Balance</label>
                                  <input
                                    type="text"
                                    value={property.loanBalance ? formatCurrency(property.loanBalance) : ''}
                                    onChange={(e) => updateProperty(property.id, 'loanBalance', e.target.value.replace(/\D/g, ''))}
                                    className={inputClass}
                                    placeholder="$0"
                                  />
                                </div>
                                <div>
                                  <label className={labelClass}>Lender</label>
                                  <input
                                    type="text"
                                    value={property.lender}
                                    onChange={(e) => updateProperty(property.id, 'lender', e.target.value)}
                                    className={inputClass}
                                    placeholder="e.g., Bank of America"
                                  />
                                </div>
                              </div>
                              <div>
                                <label className={labelClass}>Title Holders</label>
                                <input
                                  type="text"
                                  value={property.titleHolders}
                                  onChange={(e) => updateProperty(property.id, 'titleHolders', e.target.value)}
                                  className={inputClass}
                                  placeholder="Names on the title"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                        {formData.properties.length < 4 && (
                          <button
                            type="button"
                            onClick={addProperty}
                            className="w-full py-3 border-2 border-dashed border-gray-200 rounded-lg text-gray-500 hover:border-[#2aafab] hover:text-[#2aafab] transition-colors flex items-center justify-center gap-2"
                          >
                            <PlusIcon className="w-4 h-4" />
                            Add Another Property
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Step 7: Bank Statements */}
              {currentStep === 7 && (
                <div>
                  <h2 className="text-xl font-semibold text-[#0f172a] mb-2">
                    {STEPS[6].title}
                  </h2>
                  <p className="text-gray-500 text-sm mb-6">
                    Upload your last 4 months of business bank statements
                  </p>
                  <div className="space-y-6">
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-[#2aafab] transition-colors"
                    >
                      <DocumentArrowUpIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-2">Click to upload or drag and drop</p>
                      <p className="text-sm text-gray-500">PDF, PNG, JPG up to 4MB each (5MB total, max 4 files)</p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept=".pdf,.png,.jpg,.jpeg"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </div>

                    {bankStatements.length > 0 && (
                      <div className="space-y-2">
                        {bankStatements.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <DocumentArrowUpIcon className="w-5 h-5 text-gray-500" />
                              <span className="text-sm text-gray-700">{file.name}</span>
                              <span className="text-xs text-gray-500">
                                ({(file.size / 1024 / 1024).toFixed(2)} MB)
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeFile(index)}
                              className="p-1 text-red-500 hover:text-red-700 transition-colors"
                            >
                              <XMarkIcon className="w-5 h-5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 8: Review & Sign */}
              {currentStep === 8 && (
                <div>
                  <h2 className="text-xl font-semibold text-[#0f172a] mb-6">
                    {STEPS[7].title}
                  </h2>

                  {/* Summary */}
                  <div className="space-y-4 mb-8">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h3 className="font-medium text-gray-900 mb-2">Funding Request</h3>
                      <p className="text-gray-600">Amount: {formatCurrency(formData.amountRequested)}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h3 className="font-medium text-gray-900 mb-2">Business</h3>
                      <p className="text-gray-600">{formData.legalBusinessName}</p>
                      <p className="text-gray-500 text-sm">{formData.businessAddress}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h3 className="font-medium text-gray-900 mb-2">Primary Owner</h3>
                      <p className="text-gray-600">{formData.ownerFirstName} {formData.ownerLastName}</p>
                      <p className="text-gray-500 text-sm">{formData.ownerTitle} - {formData.ownershipPercentage}% ownership</p>
                    </div>
                    {formData.hasSecondOwner === 'yes' && (
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <h3 className="font-medium text-gray-900 mb-2">Second Owner</h3>
                        <p className="text-gray-600">{formData.secondOwnerFirstName} {formData.secondOwnerLastName}</p>
                        <p className="text-gray-500 text-sm">{formData.secondOwnerTitle} - {formData.secondOwnerOwnershipPercentage}% ownership</p>
                      </div>
                    )}
                  </div>

                  {/* Authorization */}
                  <div className="prose prose-sm max-w-none text-gray-600 mb-6 text-xs leading-relaxed">
                    <p className="mb-3">
                      By signing below, each of the businesses and business owners/officers listed above (individually and collectively, &quot;You&quot;) authorize Wholesale Funding Solutions (WFS), and its representatives, successors, assigns, and designees (collectively, &quot;Recipients&quot;), who may be involved in or acquire commercial loans with daily repayment features or purchases of future receivables (including but not limited to Merchant Cash Advance transactions, referred to herein as &quot;Transactions&quot;), to obtain consumer, personal, business, and investigative reports, as well as other information about You from one or more banks, creditors, credit reporting agencies, or other third parties. This authorization includes the right to access and review financial records, including but not limited to bank statements and credit card processor statements. WFS is further authorized to transmit this application, together with any information obtained in connection with it, to any or all Recipients for the purposes described above.
                    </p>
                    <p className="mb-3">
                      You further authorize any creditor or financial institution to release information relating to You directly to WFS and its Principals. You also consent to receive any legally required notices by electronic mail at the email address provided in this application. In addition, You authorize any lender or Recipient to contact You by telephone call or text message for marketing purposes at the phone number(s) provided in this application, even if such number(s) appear on a state, federal, or corporate &quot;Do Not Call&quot; registry.
                    </p>
                    <p>
                      By signing this form, You consent to receive SMS messages. Message and data rates may apply. Message frequency may vary based on interactions between You and our agents. You may opt out at any time by replying STOP, or reply HELP for additional assistance.
                    </p>
                  </div>

                  {/* Primary Owner Signature */}
                  <div className="mb-8">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Primary Owner Signature <span className="text-red-500">*</span></h3>
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <SignatureCanvas
                        ref={signatureRef}
                        canvasProps={{
                          className: 'w-full h-32 sm:h-40 bg-gray-50',
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-sm text-gray-500">Sign using your mouse or finger</p>
                      <button
                        type="button"
                        onClick={() => clearSignature(false)}
                        className="text-sm text-[#2aafab] hover:text-[#238e8b] transition-colors"
                      >
                        Clear Signature
                      </button>
                    </div>
                    <div className="mt-4 flex items-center gap-4 text-sm text-gray-600">
                      <span><strong>Name:</strong> {formData.ownerFirstName} {formData.ownerLastName}</span>
                      <span><strong>Date:</strong> {today}</span>
                    </div>
                  </div>

                  {/* Second Owner Signature */}
                  {formData.hasSecondOwner === 'yes' && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Second Owner Signature <span className="text-red-500">*</span></h3>
                      <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <SignatureCanvas
                          ref={secondSignatureRef}
                          canvasProps={{
                            className: 'w-full h-32 sm:h-40 bg-gray-50',
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-sm text-gray-500">Sign using your mouse or finger</p>
                        <button
                          type="button"
                          onClick={() => clearSignature(true)}
                          className="text-sm text-[#2aafab] hover:text-[#238e8b] transition-colors"
                        >
                          Clear Signature
                        </button>
                      </div>
                      <div className="mt-4 flex items-center gap-4 text-sm text-gray-600">
                        <span><strong>Name:</strong> {formData.secondOwnerFirstName} {formData.secondOwnerLastName}</span>
                        <span><strong>Date:</strong> {today}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex flex-col-reverse gap-3 mt-8 sm:flex-row sm:justify-between">
            <button
              type="button"
              onClick={prevStep}
              disabled={currentStep === 1}
              className={`
                flex min-h-[44px] items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors
                ${currentStep === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}
              `}
            >
              <ChevronLeftIcon className="w-5 h-5" />
              Back
            </button>

            {currentStep === STEPS.length ? (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex min-h-[44px] items-center justify-center gap-2 px-8 py-3 bg-[#2aafab] text-white font-medium rounded-lg hover:bg-[#238e8b] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Submitting...
                  </>
                ) : (
                  'Submit Application'
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={nextStep}
                className="flex min-h-[44px] items-center justify-center gap-2 px-6 py-3 bg-[#0f172a] text-white font-medium rounded-lg hover:bg-[#1e293b] transition-colors"
              >
                Continue
                <ChevronRightIcon className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* reCAPTCHA Privacy Notice */}
          <p className="text-xs text-gray-500 text-center mt-6">
            This site is protected by reCAPTCHA and the Google{' '}
            <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="underline hover:text-[#2aafab]">
              Privacy Policy
            </a>{' '}
            and{' '}
            <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer" className="underline hover:text-[#2aafab]">
              Terms of Service
            </a>{' '}
            apply.
          </p>
        </div>
      </div>
    </>
  );
}
