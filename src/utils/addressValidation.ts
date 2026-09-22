import { ShippingDetails } from '../types';

export const IRISH_COUNTIES = [
  'Antrim', 'Armagh', 'Carlow', 'Cavan', 'Clare', 'Cork', 'Derry', 'Donegal', 'Down',
  'Dublin', 'Fermanagh', 'Galway', 'Kerry', 'Kildare', 'Kilkenny', 'Laois', 'Leitrim',
  'Limerick', 'Longford', 'Louth', 'Mayo', 'Meath', 'Monaghan', 'Offaly', 'Roscommon',
  'Sligo', 'Tipperary', 'Tyrone', 'Waterford', 'Westmeath', 'Wexford', 'Wicklow'
] as const;

// Known first-letter routing keys for official Irish Eircodes
// Official An Post / Eircode spec: only A, C, D, E, F, H, K, N, P, R, T, V, W, X, Y are valid routing key prefixes
export const VALID_EIRCODE_PREFIXES = [
  'A', 'C', 'D', 'E', 'F', 'H', 'K', 'N', 'P', 'R', 'T', 'V', 'W', 'X', 'Y'
];

// Mapping of primary counties to common Eircode routing prefixes
export const COUNTY_ROUTING_MAP: Record<string, string[]> = {
  Dublin: ['D', 'K32', 'K34', 'K36', 'K45', 'K67', 'K78', 'A94', 'A96'],
  Cork: ['T', 'P', 'C'],
  Kerry: ['V'],
  Galway: ['H'],
  Limerick: ['V'],
  Kildare: ['W', 'R'],
  Meath: ['C', 'A', 'K'],
  Wicklow: ['A', 'W'],
  Tipperary: ['E'],
  Clare: ['V'],
  Mayo: ['F'],
  Donegal: ['F'],
  Waterford: ['X'],
  Louth: ['A'],
  Kilkenny: ['R'],
  Wexford: ['Y'],
  Sligo: ['F'],
  Cavan: ['H', 'A'],
  Monaghan: ['H', 'A'],
  Roscommon: ['F'],
  Westmeath: ['N'],
  Offaly: ['R'],
  Laois: ['R'],
  Carlow: ['R'],
  Longford: ['N'],
  Leitrim: ['N', 'F'],
};

const BANNED_PLACEHOLDERS = [
  'test', 'asdf', 'qwerty', 'fake', 'none', 'n/a', 'placeholder',
  'xxx', 'yyy', 'zzz', 'aaa', 'bbb', 'ccc', 'sample', 'null', 'undefined',
  'no address', 'dont know', 'unknown', 'somewhere', 'john doe', 'jane doe'
];

function isBannedOrPlaceholder(text: string): boolean {
  const lower = text.toLowerCase().trim();
  if (BANNED_PLACEHOLDERS.includes(lower)) return true;
  const words = lower.split(/[\s,.-]+/).filter(Boolean);
  return words.some((w) => ['test', 'asdf', 'qwerty', 'fake', 'placeholder', 'xxx', 'yyy', 'zzz'].includes(w));
}

export interface AddressValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  warnings: string[];
}

export function validateCustomerAddress(details: ShippingDetails): AddressValidationResult {
  const errors: Record<string, string> = {};
  const warnings: string[] = [];

  // 1. Full Name
  const cleanName = details.fullName.trim();
  if (!cleanName) {
    errors.fullName = 'Full name is required for delivery.';
  } else if (cleanName.length < 4) {
    errors.fullName = 'Please enter your full first name and surname.';
  } else if (isBannedOrPlaceholder(cleanName)) {
    errors.fullName = 'Please provide a genuine full customer name.';
  } else {
    const parts = cleanName.split(/\s+/).filter(Boolean);
    if (parts.length < 2) {
      errors.fullName = 'Please include both your first name and surname.';
    }
  }

  // 2. Email Address
  const cleanEmail = details.email.trim().toLowerCase();
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!cleanEmail) {
    errors.email = 'Email address is required for dispatch updates and receipt.';
  } else if (!emailRegex.test(cleanEmail)) {
    errors.email = 'Please enter a valid email address (e.g. name@domain.com).';
  } else if (
    cleanEmail.endsWith('@test.com') ||
    cleanEmail.endsWith('@example.com') ||
    cleanEmail.endsWith('@fake.com') ||
    cleanEmail.endsWith('@asdf.com')
  ) {
    errors.email = 'Please provide a real email address.';
  }

  // 3. Phone Number
  const cleanPhone = details.phone.replace(/[\s\-()]/g, '');
  const digitsOnly = cleanPhone.replace(/\D/g, '');
  if (!details.phone.trim()) {
    errors.phone = 'Contact telephone/mobile number is required for courier dispatch.';
  } else if (digitsOnly.length < 7 || digitsOnly.length > 16) {
    errors.phone = 'Please enter a valid phone number (7 to 15 digits).';
  } else if (/^(\d)\1+$/.test(digitsOnly) || digitsOnly === '123456789' || digitsOnly === '1234567890') {
    errors.phone = 'Please provide a genuine active phone number.';
  }

  // 4. Street Address / House / Building Number
  const cleanAddress1 = details.addressLine1.trim();
  if (!cleanAddress1) {
    errors.addressLine1 = 'House/building number or name and street address are required.';
  } else if (cleanAddress1.length < 5) {
    errors.addressLine1 = 'Please enter a complete street address.';
  } else if (isBannedOrPlaceholder(cleanAddress1)) {
    errors.addressLine1 = 'Please enter a genuine delivery address.';
  } else {
    // Check if address includes either a digit (house number) OR a recognized building indicator
    const hasHouseNumber = /\d/.test(cleanAddress1);
    const buildingWords = [
      'house', 'cottage', 'lodge', 'manor', 'hall', 'villa', 'teach', 'building',
      'tower', 'unit', 'suite', 'flat', 'apt', 'apartment', 'farm', 'glen', 'view',
      'court', 'close', 'parish', 'st.', 'saint', 'rectory', 'church'
    ];
    const hasBuildingWord = buildingWords.some((w) =>
      cleanAddress1.toLowerCase().includes(w)
    );

    if (!hasHouseNumber && !hasBuildingWord) {
      warnings.push(
        'Address might be missing a house or building number/name. Please confirm your courier can locate the property.'
      );
    }
  }

  // 5. Town / City
  const cleanCity = details.city.trim();
  if (!cleanCity) {
    errors.city = 'Town / City is required.';
  } else if (cleanCity.length < 2) {
    errors.city = 'Please enter a valid town or city name.';
  } else if (/^\d+$/.test(cleanCity)) {
    errors.city = 'Town/City cannot consist only of numbers.';
  } else if (isBannedOrPlaceholder(cleanCity)) {
    errors.city = 'Please provide a genuine town or city.';
  }

  // 6. County & Postcode/Eircode Consistency (Country-Specific)
  const country = details.country;

  if (country === 'Ireland') {
    // Check Irish county
    if (!details.county || !IRISH_COUNTIES.includes(details.county as any)) {
      errors.county = 'Please select a valid Irish county.';
    }

    // Check Irish Eircode
    const cleanEircode = details.eircodePostcode.replace(/\s+/g, '').toUpperCase();
    if (!cleanEircode) {
      errors.eircodePostcode = 'Irish Eircode is required for An Post / DPD dispatch.';
    } else if (cleanEircode.length !== 7) {
      errors.eircodePostcode = 'Eircodes must be 7 characters (e.g. D02 X285 or V93 X2K1).';
    } else {
      const firstChar = cleanEircode.charAt(0);
      if (!VALID_EIRCODE_PREFIXES.includes(firstChar)) {
        errors.eircodePostcode = `Invalid Eircode routing prefix '${firstChar}'. Letters B, G, I, J, L, M, O, Q, S, U, Z are not used in Eircodes.`;
      } else {
        // Soft consistency check against county
        const countyKey = details.county;
        const validPrefixesForCounty = COUNTY_ROUTING_MAP[countyKey];
        if (validPrefixesForCounty) {
          const matchesCounty = validPrefixesForCounty.some(
            (pref) => cleanEircode.startsWith(pref)
          );
          if (!matchesCounty) {
            warnings.push(
              `Eircode prefix '${cleanEircode.slice(0, 3)}' is uncommon for Co. ${countyKey}. Please double-check that your Eircode and County match.`
            );
          }
        }
      }
    }
  } else if (country === 'United Kingdom') {
    if (!details.county.trim()) {
      errors.county = 'County / Region is required.';
    }
    const cleanPostcode = details.eircodePostcode.trim().toUpperCase();
    const ukRegex = /^[A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2}$/;
    if (!cleanPostcode) {
      errors.eircodePostcode = 'UK Postcode is required.';
    } else if (!ukRegex.test(cleanPostcode)) {
      warnings.push('Please verify your UK Postcode format (e.g. BT1 1AA or SW1A 1AA).');
    }
  } else if (country === 'United States') {
    if (!details.county.trim()) {
      errors.county = 'State is required.';
    }
    const usZip = details.eircodePostcode.trim();
    const zipRegex = /^\d{5}(-\d{4})?$/;
    if (!usZip) {
      errors.eircodePostcode = 'US ZIP code is required.';
    } else if (!zipRegex.test(usZip)) {
      errors.eircodePostcode = 'US ZIP code must be 5 digits (e.g. 90210 or 10001-1234).';
    }
  } else {
    // International
    if (!details.county.trim()) {
      errors.county = 'Region / State / County is required.';
    }
    if (!details.eircodePostcode.trim()) {
      errors.eircodePostcode = 'Postal / ZIP code is required.';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    warnings,
  };
}

export function formatEircode(val: string): string {
  const cleaned = val.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 7);
  if (cleaned.length > 3) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
  }
  return cleaned;
}
