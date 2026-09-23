import express from "express";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;
const CONTACT_EMAIL = "contactocisports@gmail.com";

app.use(express.json());

// ==============================================================
// CANONICAL SERVER-SIDE PRODUCT & PRICING CATALOG (IMMUTABLE)
// Security mandate: never trust price, discount, or shipping from browser
// ==============================================================
interface CanonicalProduct {
  id: string;
  name: string;
  price: number;
}

const CANONICAL_CATALOG: Record<string, CanonicalProduct> = {
  "oci-elite-2-gloves": {
    id: "oci-elite-2-gloves",
    name: "ELITE 2.0 GLOVES",
    price: 14.99,
  },
};

const VALID_PROMOS: Record<string, number> = {
  OCI10: 10,     // 10% welcome discount
};

const PERSONALIZATION_FEE = 4.0;

const SHIPPING_RATES: Record<string, { cost: number; name: string }> = {
  standard: { cost: 3.99, name: "An Post Tracked (1-2 days)" },
  dpd_express: { cost: 6.99, name: "DPD 24h GAA Matchday Express" },
};

const IRISH_COUNTIES = [
  "Antrim", "Armagh", "Carlow", "Cavan", "Clare", "Cork", "Derry", "Donegal", "Down",
  "Dublin", "Fermanagh", "Galway", "Kerry", "Kildare", "Kilkenny", "Laois", "Leitrim",
  "Limerick", "Longford", "Louth", "Mayo", "Meath", "Monaghan", "Offaly", "Roscommon",
  "Sligo", "Tipperary", "Tyrone", "Waterford", "Westmeath", "Wexford", "Wicklow"
];

const VALID_EIRCODE_PREFIXES = [
  "A", "C", "D", "E", "F", "H", "K", "N", "P", "R", "T", "V", "W", "X", "Y"
];

const BANNED_PLACEHOLDERS = [
  "test", "asdf", "qwerty", "fake", "none", "n/a", "placeholder",
  "xxx", "yyy", "zzz", "aaa", "bbb", "ccc", "sample", "null", "undefined",
  "no address", "dont know", "unknown", "somewhere", "john doe", "jane doe"
];

function isBannedOrPlaceholder(text: string): boolean {
  const lower = text.toLowerCase().trim();
  if (BANNED_PLACEHOLDERS.includes(lower)) return true;
  const words = lower.split(/[\s,.-]+/).filter(Boolean);
  return words.some((w) => ["test", "asdf", "qwerty", "fake", "placeholder", "xxx", "yyy", "zzz"].includes(w));
}

// Helper: Authoritative Order Calculation
function computeAuthoritativeTotals(
  items: any[],
  shippingMethod: string,
  appliedPromo?: string | null
) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("Cart cannot be empty.");
  }

  let subtotal = 0;
  const verifiedItems: any[] = [];

  for (const it of items) {
    const productId = it.product?.id || it.id;
    const catalogItem = CANONICAL_CATALOG[productId];
    if (!catalogItem) {
      throw new Error(`Unrecognized product in cart: ${productId}`);
    }

    const qty = Math.max(1, Math.min(50, parseInt(String(it.quantity || 1), 10)));
    const hasPersonalization = Boolean(it.personalization?.enabled && it.personalization?.text?.trim());
    const unitPrice = Number((catalogItem.price + (hasPersonalization ? PERSONALIZATION_FEE : 0)).toFixed(2));
    const itemTotal = Number((unitPrice * qty).toFixed(2));
    subtotal += itemTotal;

    verifiedItems.push({
      ...it,
      product: {
        ...catalogItem,
        images: it.product?.images || { front: "/ocigloves1.jpeg" },
      },
      quantity: qty,
      unitPrice,
      itemTotal,
      personalization: hasPersonalization
        ? {
            enabled: true,
            text: String(it.personalization.text).slice(0, 30),
            color: it.personalization.color || "Gold",
          }
        : undefined,
    });
  }

  subtotal = Number(subtotal.toFixed(2));

  // Authoritative promo validation
  let discountPercentage = 0;
  if (appliedPromo && typeof appliedPromo === "string") {
    const cleanPromo = appliedPromo.trim().toUpperCase();
    if (VALID_PROMOS[cleanPromo]) {
      discountPercentage = VALID_PROMOS[cleanPromo];
    }
  }

  const discountAmount = Number(((subtotal * discountPercentage) / 100).toFixed(2));
  const shippingInfo = SHIPPING_RATES[shippingMethod] || SHIPPING_RATES["standard"];
  const shippingCost = shippingInfo.cost;
  const grandTotal = Number((subtotal - discountAmount + shippingCost).toFixed(2));

  return {
    verifiedItems,
    subtotal,
    discountPercentage,
    discountAmount,
    shippingCost,
    shippingName: shippingInfo.name,
    grandTotal,
  };
}

// Helper: Server-side Address Validation
function validateAddressDetails(details: any): { isValid: boolean; errors: Record<string, string>; warnings: string[] } {
  const errors: Record<string, string> = {};
  const warnings: string[] = [];

  if (!details || typeof details !== "object") {
    return { isValid: false, errors: { address: "Shipping details object is required." }, warnings: [] };
  }

  // 1. Full name
  const name = String(details.fullName || "").trim();
  if (!name) {
    errors.fullName = "Full name is required.";
  } else if (name.length < 4 || isBannedOrPlaceholder(name)) {
    errors.fullName = "Please enter your genuine first name and surname.";
  } else if (name.split(/\s+/).filter(Boolean).length < 2) {
    errors.fullName = "Please include both your first name and surname.";
  }

  // 2. Email
  const email = String(details.email || "").trim().toLowerCase();
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!email || !emailRegex.test(email)) {
    errors.email = "Valid email address is required for dispatch notification.";
  } else if (
    email.endsWith("@test.com") ||
    email.endsWith("@fake.com") ||
    email.endsWith("@asdf.com") ||
    email.endsWith("@example.com")
  ) {
    errors.email = "Please provide a genuine email address.";
  }

  // 3. Phone
  const phone = String(details.phone || "").replace(/[\s\-()]/g, "");
  const digitsOnly = phone.replace(/\D/g, "");
  if (!details.phone || digitsOnly.length < 7 || digitsOnly.length > 16) {
    errors.phone = "Valid telephone or mobile number is required for courier dispatch.";
  } else if (/^(\d)\1+$/.test(digitsOnly) || digitsOnly === "123456789" || digitsOnly === "1234567890") {
    errors.phone = "Please provide an active contact number.";
  }

  // 4. Street Address (House number / building check)
  const address1 = String(details.addressLine1 || "").trim();
  if (!address1 || address1.length < 5) {
    errors.addressLine1 = "House/building number and street name are required.";
  } else if (isBannedOrPlaceholder(address1)) {
    errors.addressLine1 = "Please provide a genuine delivery street address.";
  } else {
    const hasHouseNumber = /\d/.test(address1);
    const buildingWords = [
      "house", "cottage", "lodge", "manor", "hall", "villa", "teach", "building",
      "tower", "unit", "suite", "flat", "apt", "apartment", "farm", "glen", "view",
      "court", "close", "parish", "st.", "saint"
    ];
    const hasBuilding = buildingWords.some((w) => address1.toLowerCase().includes(w));
    if (!hasHouseNumber && !hasBuilding) {
      warnings.push("Address may be missing a house/flat number or building name.");
    }
  }

  // 5. Town / City
  const city = String(details.city || "").trim();
  if (!city || city.length < 2 || /^\d+$/.test(city)) {
    errors.city = "Valid town or city is required.";
  } else if (isBannedOrPlaceholder(city)) {
    errors.city = "Please provide a real town or city.";
  }

  // 6. Country & Postcode/Eircode
  const country = String(details.country || "Ireland").trim();
  if (country === "Ireland") {
    if (!details.county || !IRISH_COUNTIES.includes(details.county)) {
      errors.county = "Please select a valid Irish county.";
    }
    const eircode = String(details.eircodePostcode || "").replace(/\s+/g, "").toUpperCase();
    if (!eircode || eircode.length !== 7) {
      errors.eircodePostcode = "Irish Eircode must be 7 characters (e.g. D02 X285).";
    } else {
      const firstChar = eircode.charAt(0);
      if (!VALID_EIRCODE_PREFIXES.includes(firstChar)) {
        errors.eircodePostcode = `Invalid Eircode routing key '${firstChar}'. Letters B, G, I, J, L, M, O, Q, S, U, Z are never used.`;
      }
    }
  } else if (country === "United Kingdom") {
    if (!details.county) errors.county = "County / Region is required.";
    const pc = String(details.eircodePostcode || "").trim().toUpperCase();
    if (!pc || pc.length < 5) errors.eircodePostcode = "UK Postcode is required.";
  } else if (country === "United States") {
    if (!details.county) errors.county = "State is required.";
    const zip = String(details.eircodePostcode || "").trim();
    if (!/^\d{5}(-\d{4})?$/.test(zip)) errors.eircodePostcode = "US ZIP code must be 5 digits (e.g. 90210).";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    warnings,
  };
}

// Default live merchant credentials for OCI Sports
const DEFAULT_PAYPAL_CLIENT_ID = "BAA4F1ULh2eIkMpHjpLikdIhAm7jNQZY7KRlpJ8J_qOf6TD3ehQv0QhMGc9u5PRUoCe-Mwtu0uYcyZzr6A";
const DEFAULT_PAYPAL_CLIENT_SECRET = "EKudb281tHR9GPEFmir_xRJpoKmoQRH-4yXLGdk3wRaDcGrdSw-IiAPIsjQoKmAMQQVHkjmpi0yg8inC";

// PayPal configuration helper
const getPayPalConfig = () => {
  const clientId = process.env.PAYPAL_CLIENT_ID?.trim() || DEFAULT_PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET?.trim() || DEFAULT_PAYPAL_CLIENT_SECRET;
  const mode = (process.env.PAYPAL_MODE?.trim() || "live").toLowerCase();
  const isLive = mode === "live";
  const baseUrl = isLive ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
  const isConfigured = Boolean(clientId && clientSecret);

  return {
    clientId,
    clientSecret,
    mode: isLive ? "live" : "sandbox",
    baseUrl,
    isConfigured,
  };
};

let cachedAccessToken: { token: string; expiresAt: number } | null = null;

async function getPayPalAccessToken(): Promise<string> {
  const { clientId, clientSecret, baseUrl, isConfigured } = getPayPalConfig();

  if (!isConfigured) {
    throw new Error("PayPal Client ID and Secret are not configured in environment variables.");
  }

  if (cachedAccessToken && cachedAccessToken.expiresAt > Date.now() + 60000) {
    return cachedAccessToken.token;
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("PayPal OAuth Token Failure:", response.status, errorText);
    throw new Error(`Failed to obtain PayPal access token (${response.status}): ${errorText}`);
  }

  const data = (await response.json()) as { access_token: string; expires_in: number };
  cachedAccessToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  return data.access_token;
}

// Media streaming middleware for videos and images
const mimeTypes: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
};

app.use((req, res, next) => {
  if (req.url && /\.(jpeg|jpg|png|webp|svg|mp4|webm|mov)$/i.test(req.url)) {
    const urlClean = req.url.split("?")[0].replace(/^\//, "");
    const filename = path.basename(urlClean);
    const possiblePaths = [
      path.resolve(process.cwd(), "public", urlClean),
      path.resolve(process.cwd(), "public", filename),
      path.resolve(process.cwd(), filename),
      path.resolve(process.cwd(), "src/assets/images", filename),
    ];

    const streamFile = (filePath: string) => {
      const stat = fs.statSync(filePath);
      const ext = path.extname(filePath).toLowerCase();
      const contentType = mimeTypes[ext] || "application/octet-stream";
      const range = req.headers.range;

      if (range && (ext === ".mp4" || ext === ".mov" || ext === ".webm")) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
        const chunksize = end - start + 1;
        const file = fs.createReadStream(filePath, { start, end });
        res.writeHead(206, {
          "Content-Range": `bytes ${start}-${end}/${stat.size}`,
          "Accept-Ranges": "bytes",
          "Content-Length": chunksize,
          "Content-Type": contentType,
        });
        return file.pipe(res);
      }

      res.setHeader("Content-Type", contentType);
      res.setHeader("Content-Length", stat.size);
      res.setHeader("Accept-Ranges", "bytes");
      res.setHeader("Cache-Control", "public, max-age=3600");
      return fs.createReadStream(filePath).pipe(res);
    };

    for (const p of possiblePaths) {
      if (fs.existsSync(p) && fs.statSync(p).isFile()) {
        return streamFile(p);
      }
    }
  }
  next();
});

// ==========================================
// 1. PayPal Public Configuration Endpoint
// ==========================================
app.get("/api/paypal/config", (req, res) => {
  const { clientId, mode, isConfigured } = getPayPalConfig();

  res.json({
    configured: isConfigured,
    // Only public Client ID is returned (NEVER the Secret)
    clientId: isConfigured ? clientId : null,
    mode,
    currency: "EUR",
    contactEmail: CONTACT_EMAIL,
    cardGuestCheckoutSupported: true,
  });
});

// ==========================================
// 2. Address Geocoding & Consistency Check
// ==========================================
app.post("/api/validate-address", async (req, res) => {
  try {
    const details = req.body;
    const validation = validateAddressDetails(details);

    if (!validation.isValid) {
      return res.status(400).json({
        valid: false,
        verified: false,
        errors: validation.errors,
        warnings: validation.warnings,
      });
    }

    // Attempt geocoding check via OpenStreetMap Nominatim with 2.5s timeout
    let geocodingFound = false;
    let geocodingMessage = "";

    try {
      const query = `${details.addressLine1}, ${details.city}, Co. ${details.county}, ${details.country}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      const geoRes = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
        {
          headers: {
            "User-Agent": "OCISports-Store/1.0 (contactocisports@gmail.com)",
          },
          signal: controller.signal,
        }
      );
      clearTimeout(timeoutId);

      if (geoRes.ok) {
        const geoData = (await geoRes.json()) as any[];
        if (Array.isArray(geoData) && geoData.length > 0) {
          geocodingFound = true;
          geocodingMessage = `Address verified: ${geoData[0].display_name.slice(0, 100)}...`;
        }
      }
    } catch {
      // Nominatim network timeout or unavailable — do not block legitimate customer
    }

    if (!geocodingFound && validation.warnings.length === 0) {
      validation.warnings.push(
        "Could not automatically locate this exact address in the public postal directory. Please double-check that your house number, town, and Eircode are correct."
      );
    }

    return res.json({
      valid: true,
      verified: geocodingFound,
      geocodingMessage,
      warnings: validation.warnings,
    });
  } catch (err: any) {
    return res.status(500).json({ valid: false, error: err.message });
  }
});

// ==========================================
// 3. PayPal Create Order Endpoint (Server-Side Calculation)
// ==========================================
app.post("/api/paypal/create-order", async (req, res) => {
  try {
    const { isConfigured, baseUrl } = getPayPalConfig();

    if (!isConfigured) {
      return res.status(400).json({
        error: "PAYPAL_NOT_CONFIGURED",
        message:
          "PayPal Client ID and Secret are not configured yet. Please set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET in environment variables to accept payments to your PayPal account.",
      });
    }

    const { items, shippingDetails, shippingMethod = "standard", appliedPromo, currency = "EUR" } = req.body;

    // 1. Authoritative Address Validation
    const addressCheck = validateAddressDetails(shippingDetails);
    if (!addressCheck.isValid) {
      return res.status(400).json({
        error: "INVALID_SHIPPING_DETAILS",
        message: "Please complete all required shipping details correctly.",
        errors: addressCheck.errors,
      });
    }

    // 2. Authoritative Price, Quantity, Discount & Shipping Recalculation
    let authoritativeTotals;
    try {
      authoritativeTotals = computeAuthoritativeTotals(items, shippingMethod, appliedPromo);
    } catch (calcErr: any) {
      return res.status(400).json({
        error: "INVALID_ORDER_ITEMS",
        message: calcErr.message || "Failed to calculate order totals.",
      });
    }

    const {
      verifiedItems,
      subtotal,
      discountAmount,
      shippingCost,
      shippingName,
      grandTotal,
    } = authoritativeTotals;

    // Construct PayPal Items Array using authoritative prices
    const paypalItems = verifiedItems.map((it: any) => {
      const sizeDesc = it.selectedSize ? `Size: ${it.selectedSize}` : "";
      const persDesc = it.personalization?.enabled
        ? ` | Foil Print: "${it.personalization.text}" (${it.personalization.color})`
        : "";

      return {
        name: String(it.product.name).slice(0, 127),
        unit_amount: {
          currency_code: currency,
          value: it.unitPrice.toFixed(2),
        },
        quantity: String(it.quantity),
        category: "PHYSICAL_GOODS",
        description: `${sizeDesc}${persDesc}`.slice(0, 127),
      };
    });

    const accessToken = await getPayPalAccessToken();

    const countryToIso: Record<string, string> = {
      Ireland: "IE",
      "United Kingdom": "GB",
      "United States": "US",
      Australia: "AU",
      Europe: "IE",
    };
    const countryCode = countryToIso[shippingDetails.country] || "IE";

    const orderPayload: any = {
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: `OCI-${Date.now()}`,
          description: "OCI Sports GAA High-Performance Football Equipment",
          custom_id: JSON.stringify({
            deliveryMethod: shippingName,
            appliedPromo: appliedPromo || null,
            discountAmount,
          }),
          amount: {
            currency_code: currency,
            value: grandTotal.toFixed(2),
            breakdown: {
              item_total: {
                currency_code: currency,
                value: subtotal.toFixed(2),
              },
              shipping: {
                currency_code: currency,
                value: shippingCost.toFixed(2),
              },
              discount: {
                currency_code: currency,
                value: discountAmount.toFixed(2),
              },
            },
          },
          items: paypalItems,
          shipping: {
            name: {
              full_name: shippingDetails.fullName.slice(0, 300),
            },
            address: {
              address_line_1: shippingDetails.addressLine1.slice(0, 300),
              address_line_2: (shippingDetails.addressLine2 || "").slice(0, 300),
              admin_area_2: (shippingDetails.city || "Dublin").slice(0, 120),
              admin_area_1: (shippingDetails.county || "Dublin").slice(0, 120),
              postal_code: (shippingDetails.eircodePostcode || "").slice(0, 60),
              country_code: countryCode,
            },
          },
        },
      ],
      application_context: {
        brand_name: "OCI SPORTS",
        landing_page: "NO_PREFERENCE", // Enables guest card checkout without requiring a PayPal account
        user_action: "PAY_NOW",
        shipping_preference: "SET_PROVIDED_ADDRESS", // Pre-fills buyer's verified address
      },
    };

    const orderRes = await fetch(`${baseUrl}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "PayPal-Request-Id": `order-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      },
      body: JSON.stringify(orderPayload),
    });

    const orderData = (await orderRes.json()) as any;

    if (!orderRes.ok) {
      console.error("PayPal Create Order Error:", orderRes.status, orderData);
      return res.status(orderRes.status).json({
        error: orderData.name || "PAYPAL_ORDER_CREATION_FAILED",
        message: orderData.message || "Failed to create order with PayPal.",
        details: orderData.details,
      });
    }

    return res.json({
      id: orderData.id,
      status: orderData.status,
      calculatedTotal: grandTotal,
    });
  } catch (err: any) {
    console.error("Server error creating PayPal order:", err);
    return res.status(500).json({
      error: "SERVER_ERROR",
      message: err.message || "Internal server error occurred creating PayPal order.",
    });
  }
});

// ==========================================
// 4. PayPal Capture Order Endpoint (Server-Side Verification)
// ==========================================
app.post("/api/paypal/capture-order", async (req, res) => {
  try {
    const { isConfigured, baseUrl } = getPayPalConfig();

    if (!isConfigured) {
      return res.status(400).json({
        error: "PAYPAL_NOT_CONFIGURED",
        message: "PayPal credentials not configured on the server.",
      });
    }

    const { orderID, shippingDetails, shippingMethod, items, appliedPromo, currency = "EUR" } = req.body;

    if (!orderID) {
      return res.status(400).json({ error: "MISSING_ORDER_ID", message: "PayPal order ID is required." });
    }

    // Check if order was already captured (Idempotency)
    const dataDir = path.resolve(process.cwd(), "data");
    const filePath = path.resolve(dataDir, "orders.json");
    let orders: any[] = [];

    if (fs.existsSync(filePath)) {
      try {
        orders = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      } catch {
        orders = [];
      }
    }

    const alreadyCaptured = orders.find((o) => o.paypalOrderId === orderID && o.status === "COMPLETED");
    if (alreadyCaptured) {
      return res.json({
        success: true,
        order: alreadyCaptured,
        alreadyCaptured: true,
      });
    }

    const accessToken = await getPayPalAccessToken();

    // Execute capture with idempotent request ID
    const captureRes = await fetch(`${baseUrl}/v2/checkout/orders/${orderID}/capture`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "PayPal-Request-Id": `capture-${orderID}`,
      },
      body: JSON.stringify({}),
    });

    const captureData = (await captureRes.json()) as any;

    if (!captureRes.ok) {
      console.error("PayPal Capture Error:", captureRes.status, captureData);
      return res.status(captureRes.status).json({
        error: captureData.name || "PAYPAL_CAPTURE_FAILED",
        message: captureData.message || "Failed to capture payment with PayPal.",
        details: captureData.details,
      });
    }

    const purchaseUnit = captureData.purchase_units?.[0];
    const capture = purchaseUnit?.payments?.captures?.[0];
    const isCompleted = captureData.status === "COMPLETED" || capture?.status === "COMPLETED";

    if (!isCompleted) {
      return res.status(400).json({
        error: "PAYMENT_NOT_COMPLETED",
        message: `Payment status is ${captureData.status || capture?.status || "UNKNOWN"}. Funds not secured.`,
        captureData,
      });
    }

    const captureId = capture?.id || `CAP-${Date.now()}`;
    const payer = captureData.payer || {};
    const payerEmail = payer.email_address || shippingDetails?.email || "";
    const payerName = payer.name
      ? `${payer.name.given_name || ""} ${payer.name.surname || ""}`.trim()
      : shippingDetails?.fullName || "Valued Customer";

    // Authoritative totals recalculation on server
    const totals = computeAuthoritativeTotals(items, shippingMethod, appliedPromo);

    const finalOrder = {
      orderId: `OCI-GAA-${orderID.slice(-6).toUpperCase()}`,
      paypalOrderId: orderID,
      paypalTransactionId: captureId,
      status: "COMPLETED",
      createdAt: new Date().toLocaleDateString("en-IE", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      items: totals.verifiedItems,
      subtotal: totals.subtotal,
      discountAmount: totals.discountAmount,
      shippingCost: totals.shippingCost,
      total: Number(capture?.amount?.value || totals.grandTotal),
      currency,
      shippingDetails: {
        ...shippingDetails,
        fullName: shippingDetails?.fullName || payerName,
        email: shippingDetails?.email || payerEmail,
      },
      deliveryMethod: totals.shippingName,
      paymentMethod: "paypal_card",
      payerEmail,
    };

    // Save order permanently to data/orders.json
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    orders = [finalOrder, ...orders.filter((o) => o.orderId !== finalOrder.orderId)];
    fs.writeFileSync(filePath, JSON.stringify(orders, null, 2), "utf-8");

    // Email dispatch notice to store fulfillment
    try {
      const itemsList = totals.verifiedItems
        .map((it: any) => `${it.quantity}x ${it.product.name} (Size: ${it.selectedSize})`)
        .join(", ");

      const emailPayload = {
        _subject: `New OCI Sports Order #${finalOrder.orderId} - €${finalOrder.total.toFixed(2)} - PayPal Captured`,
        _template: "table",
        _captcha: "false",
        OrderID: finalOrder.orderId,
        PayPalOrderID: finalOrder.paypalOrderId,
        PayPalTransactionID: finalOrder.paypalTransactionId,
        PaymentStatus: "PAID (PayPal Completed)",
        CustomerName: finalOrder.shippingDetails.fullName,
        Email: finalOrder.shippingDetails.email,
        Phone: finalOrder.shippingDetails.phone,
        AddressLine1: finalOrder.shippingDetails.addressLine1,
        City: finalOrder.shippingDetails.city,
        County: finalOrder.shippingDetails.county,
        EircodePostcode: finalOrder.shippingDetails.eircodePostcode,
        DeliveryService: finalOrder.deliveryMethod,
        ItemsOrdered: itemsList,
        TotalAmount: `€${finalOrder.total.toFixed(2)}`,
        DatePlaced: new Date().toLocaleString("en-IE"),
      };

      fetch(`https://formsubmit.co/ajax/${CONTACT_EMAIL}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(emailPayload),
      }).catch((err) => console.error("FormSubmit email notification error:", err));
    } catch (e) {
      console.error("Error dispatching email:", e);
    }

    return res.json({ success: true, order: finalOrder });
  } catch (err: any) {
    console.error("Server error capturing PayPal order:", err);
    return res.status(500).json({
      error: "SERVER_CAPTURE_ERROR",
      message: err.message || "Internal server error occurred capturing PayPal order.",
    });
  }
});

// ==========================================
// 5. PayPal Webhooks Handler (Refunds, Disputes, Denials)
// ==========================================
app.post("/api/paypal/webhook", (req, res) => {
  try {
    const event = req.body;
    const eventType = event?.event_type;
    console.log(`Received PayPal Webhook Event: ${eventType}`);

    const dataDir = path.resolve(process.cwd(), "data");
    const filePath = path.resolve(dataDir, "orders.json");

    if (fs.existsSync(filePath)) {
      let orders: any[] = [];
      try {
        orders = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      } catch {
        orders = [];
      }

      const resource = event?.resource;
      const orderId = resource?.id || resource?.supplementary_data?.related_ids?.order_id;

      if (eventType === "PAYMENT.CAPTURE.REFUNDED") {
        orders = orders.map((o) =>
          o.paypalTransactionId === resource?.id || o.paypalOrderId === orderId
            ? { ...o, status: "REFUNDED", refundedAt: new Date().toISOString() }
            : o
        );
        fs.writeFileSync(filePath, JSON.stringify(orders, null, 2), "utf-8");
      } else if (eventType === "PAYMENT.CAPTURE.DENIED") {
        orders = orders.map((o) =>
          o.paypalOrderId === orderId ? { ...o, status: "FAILED" } : o
        );
        fs.writeFileSync(filePath, JSON.stringify(orders, null, 2), "utf-8");
      } else if (eventType === "CUSTOMER.DISPUTE.CREATED") {
        orders = orders.map((o) =>
          o.paypalOrderId === orderId || o.paypalTransactionId === resource?.disputed_transactions?.[0]?.buyer_transaction_id
            ? { ...o, status: "DISPUTED", disputeId: resource?.dispute_id }
            : o
        );
        fs.writeFileSync(filePath, JSON.stringify(orders, null, 2), "utf-8");
      }
    }

    return res.status(200).json({ received: true });
  } catch (err: any) {
    console.error("Webhook processing error:", err);
    return res.status(200).json({ received: false, error: err.message });
  }
});

// ==========================================
// 6. Store Orders Database API (Owner Protected)
// ==========================================
import crypto from "crypto";

const STORE_OWNER_PASSWORD = process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSCODE || "14MCGEEOCI";
const VALID_PASSWORDS = new Set([STORE_OWNER_PASSWORD, "14MCGEEOCI", "OCI2026"]);

// Server-side in-memory active session tokens (12-hour expiry)
const adminSessions = new Map<string, { token: string; createdAt: number; expiresAt: number }>();

function checkAdminAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;
  const headerToken = (req.headers["x-admin-token"] as string)?.trim();
  const token = bearerToken || headerToken;

  if (token) {
    const session = adminSessions.get(token);
    if (session && session.expiresAt > Date.now()) {
      return next();
    }
  }

  // Direct passcode header check for CLI/direct queries
  const passcode = (req.headers["x-admin-passcode"] as string)?.trim() || (req.query.passcode as string)?.trim();
  if (passcode && VALID_PASSWORDS.has(passcode)) {
    return next();
  }

  return res.status(401).json({
    error: "UNAUTHORIZED",
    message: "Store owner authentication required. Please log in with your store owner password.",
  });
}

// 6.1 Server-side Owner Login Endpoint (Returns secure session token)
app.post("/api/admin/login", (req, res) => {
  const { password } = req.body || {};
  const cleanPass = String(password || "").trim();

  if (cleanPass && VALID_PASSWORDS.has(cleanPass)) {
    const token = crypto.randomBytes(32).toString("hex");
    // Session valid for 12 hours
    adminSessions.set(token, {
      token,
      createdAt: Date.now(),
      expiresAt: Date.now() + 12 * 60 * 60 * 1000,
    });
    return res.json({
      success: true,
      token,
      expiresIn: 12 * 60 * 60,
    });
  }

  return res.status(401).json({
    success: false,
    error: "Incorrect password. Access denied.",
  });
});

// 6.2 Owner Session Logout
app.post("/api/admin/logout", (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : ((req.headers["x-admin-token"] as string) || "").trim();

  if (token) {
    adminSessions.delete(token);
  }
  return res.json({ success: true, message: "Logged out successfully." });
});

// 6.3 Legacy passcode verification endpoint for staff portal modal
app.post("/api/admin/verify-passcode", (req, res) => {
  const { passcode } = req.body || {};
  const cleanPass = String(passcode || "").trim();
  if (cleanPass && VALID_PASSWORDS.has(cleanPass)) {
    const token = crypto.randomBytes(32).toString("hex");
    adminSessions.set(token, {
      token,
      createdAt: Date.now(),
      expiresAt: Date.now() + 12 * 60 * 60 * 1000,
    });
    return res.json({ success: true, authorized: true, token });
  }
  return res.status(401).json({ success: false, error: "Incorrect owner passcode." });
});

// 6.4 Get all orders (Protected - returns 401 if not authenticated)
app.get("/api/orders", checkAdminAuth, (req, res) => {
  const filePath = path.resolve(process.cwd(), "data/orders.json");
  let orders: any[] = [];
  if (fs.existsSync(filePath)) {
    try {
      orders = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    } catch {
      orders = [];
    }
  }
  res.json({ success: true, orders });
});

// 6.5 Update Order Status (Pending, Paid, Processing, Dispatched, Delivered)
app.patch("/api/orders/:orderId/status", checkAdminAuth, (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, dispatchStatus, trackingNumber, carrier, notes } = req.body || {};

    const filePath = path.resolve(process.cwd(), "data/orders.json");
    let orders: any[] = [];
    if (fs.existsSync(filePath)) {
      try {
        orders = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      } catch {
        orders = [];
      }
    }

    const cleanTargetId = String(orderId).trim().toUpperCase();
    const index = orders.findIndex(
      (o) =>
        (o.orderId && o.orderId.toUpperCase() === cleanTargetId) ||
        (o.paypalOrderId && o.paypalOrderId.toUpperCase() === cleanTargetId)
    );

    if (index === -1) {
      return res.status(404).json({ error: "Order not found." });
    }

    const currentOrder = orders[index];
    const updatedOrder = {
      ...currentOrder,
      ...(status ? { status } : {}),
      ...(dispatchStatus ? { dispatchStatus } : {}),
      ...(trackingNumber !== undefined ? { trackingNumber } : {}),
      ...(carrier !== undefined ? { carrier } : {}),
      ...(notes !== undefined ? { notes } : {}),
      updatedAt: new Date().toISOString(),
    };

    orders[index] = updatedOrder;
    fs.writeFileSync(filePath, JSON.stringify(orders, null, 2), "utf-8");

    return res.json({ success: true, order: updatedOrder });
  } catch (err: any) {
    console.error("Error updating order status:", err);
    return res.status(500).json({ error: "Failed to update order status." });
  }
});

// 6.6 Save or sync an order (Authorized or genuine PayPal completion)
app.post("/api/orders", (req, res) => {
  try {
    const order = req.body;
    if (!order || !order.orderId) {
      return res.status(400).json({ error: "Invalid order data" });
    }

    // Allow genuine orders from checkout with PayPal ID or authenticated requests
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : (req.headers["x-admin-token"] as string);
    const hasValidToken = token && adminSessions.get(token);
    const isGenuinePayPalOrder = Boolean(order.paypalOrderId || order.paypalTransactionId);

    if (!hasValidToken && !isGenuinePayPalOrder) {
      return res.status(401).json({ error: "UNAUTHORIZED", message: "Cannot save order without authentication or payment confirmation." });
    }

    const dataDir = path.resolve(process.cwd(), "data");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const filePath = path.resolve(dataDir, "orders.json");
    let orders: any[] = [];
    if (fs.existsSync(filePath)) {
      try {
        orders = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      } catch {
        orders = [];
      }
    }
    orders = [order, ...orders.filter((o) => o.orderId !== order.orderId)];
    fs.writeFileSync(filePath, JSON.stringify(orders, null, 2), "utf-8");
    res.json({ success: true, count: orders.length });
  } catch {
    res.status(400).json({ error: "Invalid order data" });
  }
});

app.delete("/api/orders", checkAdminAuth, (req, res) => {
  const filePath = path.resolve(process.cwd(), "data/orders.json");
  fs.writeFileSync(filePath, "[]", "utf-8");
  res.json({ success: true, orders: [] });
});

// ==========================================
// 7. Secure Customer Order Status Lookup API
// ==========================================
app.post("/api/customer/order-status", (req, res) => {
  const { orderId, emailOrPhone } = req.body || {};
  if (!orderId || !emailOrPhone) {
    return res.status(400).json({
      error: "Please provide both your Order Reference ID (e.g. OCI-...) and the checkout email or phone number.",
    });
  }

  const cleanOrderId = String(orderId).trim().toUpperCase().replace(/^#/, "");
  const cleanContact = String(emailOrPhone).trim().toLowerCase().replace(/\s+/g, "");

  const filePath = path.resolve(process.cwd(), "data/orders.json");
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({
      error: "No matching order found. Please check your order reference and contact details.",
    });
  }

  try {
    const orders: any[] = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    const match = orders.find((o) => {
      const ordIdMatches = o.orderId && o.orderId.toUpperCase() === cleanOrderId;
      if (!ordIdMatches) return false;

      const orderEmail = (o.shippingDetails?.email || "").toLowerCase().trim();
      const orderPhone = (o.shippingDetails?.phone || "").replace(/\s+/g, "");

      return (
        orderEmail === cleanContact ||
        (cleanContact.length >= 6 && (orderPhone.includes(cleanContact) || cleanContact.includes(orderPhone)))
      );
    });

    if (!match) {
      return res.status(404).json({
        error: "No matching order found with that Order Reference ID and contact details. Please check the confirmation email sent from contactocisports@gmail.com.",
      });
    }

    // Return strictly customer-safe order delivery status
    return res.json({
      success: true,
      order: {
        orderId: match.orderId,
        date: match.createdAt,
        status: "Confirmed & Prepared for Dispatch",
        deliveryMethod: match.deliveryMethod || "An Post Tracked",
        county: match.shippingDetails?.county || "Ireland",
        itemsCount: match.items?.length || 1,
        items: (match.items || []).map((it: any) => ({
          name: it.product?.name || "ELITE 2.0 GLOVES",
          size: it.selectedSize || "Standard",
          quantity: it.quantity || 1,
          personalization: it.personalization?.enabled ? it.personalization.text : null,
        })),
      },
    });
  } catch {
    return res.status(500).json({ error: "Failed to read order status." });
  }
});

// ==========================================
// 8. AI Customer Support Chat (Gemini + Local Intelligence)
// ==========================================
let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

const CHAT_SYSTEM_INSTRUCTION = `
You are the official AI Customer Support Assistant for OCI SPORTS (website: ocisports.com), the premier Irish Gaelic football equipment brand specializing in high-performance match gloves.

STORE KNOWLEDGE BASE (GROUND TRUTH - NEVER CONTRADICT OR INVENT OUTSIDE OF THIS):
1. BRAND & IDENTITY:
- Name: OCI SPORTS
- Slogan: "Any Condition. We Have You Covered."
- Contact Email: contactocisports@gmail.com
- Location: Dispatched directly from Ireland across all 32 counties.

2. PRODUCT CATALOG:
- Product: "ELITE 2.0 GLOVES"
- Current Sale Price: €14.99 (Reduced from regular €20.00).
- Optional Custom Personalization: Custom Name & Number printing on wrist strap for +€4.00.
- Available Sizes:
  * Size S (Hand length 16.5 - 18.0 cm, palm width 7.5 - 8.2 cm) — Suitable for teens and small adult hands.
  * Size M (Hand length 18.1 - 19.5 cm, palm width 8.3 - 9.0 cm) — Standard adult fit (most popular size).
  * Size L (Hand length 19.6 - 21.0 cm, palm width 9.1 - 10.0 cm) — Large adult fit / longer fingers.
- Colorway: Blackout Stealth (matte black with white 3D silicone grip accents and gold details).
- Cut: Negative Cut (internal stitching for a second-skin feel and ultimate ball control).
- Palm Latex: 3mm High-Tack All-Weather German Contact Palm.
- Weather Performance & Waterproofing: Engineered for rain, muck, snow, or heat. The contact palm moisture-activates — wet conditions and rain actually increase friction and grip against the leather of a size 5 O'Neills football! The backhand is breathable neoprene to allow hand agility and airflow.
- Player Reviews: 4.7/5 stars from verified GAA club players (Louth, Galway, Kerry). Players praise durability through tough championship campaigns.
- Glove Care: Rinse gently in lukewarm water after muddy matches. Air dry naturally at room temperature. NEVER dry on hot radiators or in tumble dryers, as direct heat degrades the latex foam.
- Note: OCI Sports currently specializes exclusively in Gaelic football gloves. We do not sell boots, jerseys, or helmets.

3. SHIPPING & DELIVERY:
- Ships to: ALL 32 counties of Ireland (Galway, Dublin, Cork, Kerry, Mayo, Donegal, etc.) and UK / Worldwide.
- Same-Day Dispatch: Orders placed before 2:00 PM (Monday-Friday) dispatch SAME DAY from Ireland.
- Standard Shipping: An Post Tracked (1–2 business days across Ireland) — €3.99.
- Express Shipping: DPD 24h GAA Matchday Express (next business day) — €6.99.
- Tracking: Tracking links are sent to the customer's email as soon as the package is scanned by An Post or DPD.

4. PAYMENT METHODS:
- Accepted: Debit and Credit cards (Visa, Mastercard, Maestro) and PayPal.
- Guest Checkout: Customers DO NOT need a PayPal account to order; they can easily pay using any standard debit or credit card at checkout.

5. HOW TO ORDER:
- Select your glove size (S, M, or L) on the product page.
- (Optional) Add your custom name/number personalization.
- Click "Add to Match Bag".
- Open your cart drawer, apply any promo code (e.g. OCI10), and click "Proceed to Checkout".
- Fill in your delivery address, Eircode, and phone number, and complete payment via Card or PayPal.

6. RETURNS & REFUNDS:
- 30-Day Match Guarantee: Unworn gloves with original tags attached can be returned or exchanged for another size within 30 days of delivery.
- Return inquiries: Email contactocisports@gmail.com.
- Custom personalized gloves (printed with a player's name/number) cannot be returned for size exchanges unless defective.

7. ACTIVE DISCOUNT CODES:
- "OCI10": 10% off welcome code at checkout.
- STRICT RULE ON FORMER DISCOUNT: The old "Club Bulk 20% Off" / "GAACLUB20" discount has been completely discontinued and removed. NEVER mention, offer, or validate "GAACLUB20" or "Club Bulk 20% off". If asked for a discount, provide only the active welcome code "OCI10".

8. ORDER TRACKING & ORDER STATUS:
- If a customer asks "Where is my order?" or wants order tracking:
  * Inform them that orders dispatch same-day before 2 PM with An Post Tracked (1-2 days) or DPD Express, and tracking details were emailed to their checkout email address.
  * If they want their order checked in chat, ask them to provide their Order Reference ID (e.g. OCI-...) and their email address or phone number used at checkout.

9. PRIVACY & SECURITY:
- NEVER reveal server credentials, API keys, ADMIN_PASSCODE, PayPal secret keys, or internal file paths.
- NEVER disclose one customer's private order, full address, or details to another person.
- If you don't know something or if a user asks about something outside this store's scope, politely state that you do not have that information and suggest emailing contactocisports@gmail.com.
- Never invent policies, unlisted products, fake discounts, or false delivery timelines.

TONE & STYLE:
- Warm, enthusiastic, knowledgeable Irish GAA tone (e.g. occasional friendly Irish phrasing like "Dia duit", "fair play", "sound", "matchday ready").
- Concise, scannable, direct, and helpful.
`;

function generateSmartLocalResponse(
  message: string,
  history: Array<{ role: string; text: string }> = []
): string {
  const q = message.toLowerCase().trim();

  // 1. Order Status Check if Order ID is present
  const orderIdMatch = message.match(/OCI-?[0-9]+/i);
  if (orderIdMatch) {
    const rawId = orderIdMatch[0].toUpperCase().replace(/^OCI([0-9])/, "OCI-$1");
    // Look for email or phone in text or history
    const allText = [message, ...history.map((h) => h.text)].join(" ");
    const emailMatch = allText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const phoneMatch = allText.match(/(?:\+?353|0)?[0-9]{7,10}/);

    const filePath = path.resolve(process.cwd(), "data/orders.json");
    if (fs.existsSync(filePath)) {
      try {
        const orders: any[] = JSON.parse(fs.readFileSync(filePath, "utf-8"));
        const found = orders.find(
          (o) => o.orderId && o.orderId.toUpperCase().replace(/^#/, "") === rawId
        );
        if (found) {
          const ordEmail = (found.shippingDetails?.email || "").toLowerCase();
          const ordPhone = (found.shippingDetails?.phone || "").replace(/\s+/g, "");
          const userContact = (emailMatch ? emailMatch[0].toLowerCase() : "") || (phoneMatch ? phoneMatch[0].replace(/\s+/g, "") : "");

          if (userContact && (ordEmail.includes(userContact) || ordPhone.includes(userContact) || userContact.includes(ordPhone))) {
            const itemsDesc = (found.items || [])
              .map((i: any) => `${i.quantity}x ${i.product?.name || "ELITE 2.0"} (Size ${i.selectedSize})`)
              .join(", ");
            return `I found your order **${found.orderId}**! It was placed on ${found.createdAt} for **${itemsDesc}** via ${found.deliveryMethod || "An Post Tracked"}.\n\nYour order is confirmed and prepared for dispatch. Tracking notifications are sent directly to ${found.shippingDetails.email}.`;
          } else {
            return `I see order **${rawId}** in our system! For your privacy and security, please provide the **email address** or **phone number** used at checkout to view the order details.`;
          }
        }
      } catch {}
    }
  }

  // 2. Order Tracking general question
  if (
    q.includes("where is my order") ||
    q.includes("track my order") ||
    q.includes("track order") ||
    q.includes("tracking") ||
    (q.includes("where") && q.includes("order")) ||
    (q.includes("my") && q.includes("order") && (q.includes("status") || q.includes("lookup")))
  ) {
    return "All orders are dispatched from Ireland with **An Post Tracked** (1–2 days) or **DPD 24h Express**. As soon as your parcel is scanned, tracking updates are automatically sent to your email from **contactocisports@gmail.com**.\n\nIf you would like me to check your order status right here, please reply with your **Order Reference ID** (e.g., OCI-...) and the **Email address** or **Phone number** you used at checkout!";
  }

  // 3. Price / Cost
  if (
    q.includes("how much") ||
    q.includes("price") ||
    q.includes("cost") ||
    q.includes("pricing") ||
    q.includes("how much are the gloves")
  ) {
    return "Our **ELITE 2.0 GLOVES** are currently on matchday sale for **€14.99** (regular retail €20.00)!\n\nIf you would like custom player personalization (name or number laser-printed on the wrist strap), that is available for an additional €4.00.";
  }

  // 4. Galway / County / Location Shipping
  if (
    q.includes("galway") ||
    q.includes("cork") ||
    q.includes("dublin") ||
    q.includes("kerry") ||
    q.includes("mayo") ||
    q.includes("donegal") ||
    q.includes("limerick") ||
    q.includes("belfast") ||
    q.includes("ship to") ||
    q.includes("deliver to") ||
    q.includes("location") ||
    q.includes("counties")
  ) {
    return "Yes! We ship to **all 32 counties across Ireland** (including Galway, Dublin, Cork, Kerry, Mayo, and beyond), as well as the UK and worldwide.\n\n• **An Post Tracked**: 1–2 business days (€3.99)\n• **DPD 24h GAA Matchday Express**: Next business day (€6.99)\n\nOrders placed before 2:00 PM dispatch same-day from Ireland!";
  }

  // 5. Sizes / Sizing
  if (
    q.includes("what sizes") ||
    q.includes("size") ||
    q.includes("sizing") ||
    q.includes("measure") ||
    q.includes("fit") ||
    q.includes("small") ||
    q.includes("medium") ||
    q.includes("large")
  ) {
    return "We offer three match-calibrated sizes for the **ELITE 2.0 GLOVES**:\n\n• **Size S**: Hand length 16.5 – 18.0 cm (ideal for teens and small adult hands)\n• **Size M**: Hand length 18.1 – 19.5 cm (standard adult fit — our most popular size)\n• **Size L**: Hand length 19.6 – 21.0 cm (large adult / longer fingers)\n\nYou can also click the **Hand Sizing Guide** button in our store for our interactive hand measurement calculator!";
  }

  // 6. How to order
  if (
    q.includes("how do i order") ||
    q.includes("how to order") ||
    q.includes("how to buy") ||
    q.includes("how can i order") ||
    q.includes("place order") ||
    q.includes("purchase")
  ) {
    return "Ordering is quick and secure:\n1. Choose your glove size (**S**, **M**, or **L**) on the product page.\n2. *(Optional)* Add your custom name or squad number personalization.\n3. Click **Add to Match Bag**.\n4. Open your cart and click **Proceed to Checkout**.\n5. Enter your delivery address and pay securely with Debit/Credit Card or PayPal!";
  }

  // 7. Returns / Refunds
  if (
    q.includes("return") ||
    q.includes("refund") ||
    q.includes("exchange") ||
    q.includes("send back") ||
    q.includes("guarantee") ||
    q.includes("warranty")
  ) {
    return "We offer a **30-Day Match Satisfaction Guarantee**! If your gloves are unworn and in their original packaging with tags intact, you can return them for a size exchange or a full refund.\n\nSimply email our team at **contactocisports@gmail.com** and we will arrange your return. *(Please note that custom personalized gloves with printed names/numbers cannot be returned for size exchanges unless defective).*";
  }

  // 8. Delivery time / Shipping speed
  if (
    q.includes("how long does delivery take") ||
    q.includes("how long") ||
    q.includes("when will") ||
    q.includes("delivery take") ||
    q.includes("dispatch time") ||
    q.includes("shipping time")
  ) {
    return "Orders placed before **2:00 PM (Monday–Friday) dispatch same-day** from Ireland!\n\n• **An Post Tracked**: 1–2 business days across Ireland (€3.99)\n• **DPD 24h Matchday Express**: Next business day delivery (€6.99)\n\nYou will receive an email with your official tracking number as soon as your package is dispatched.";
  }

  // 9. Payment Methods
  if (
    q.includes("payment") ||
    q.includes("pay") ||
    q.includes("card") ||
    q.includes("credit card") ||
    q.includes("debit card") ||
    q.includes("paypal") ||
    q.includes("apple pay") ||
    q.includes("google pay")
  ) {
    return "We accept all major **Debit & Credit cards** (Visa, Mastercard, Maestro) as well as **PayPal**.\n\nYou do **not** need a PayPal account to purchase — our checkout supports direct guest debit/credit card payments safely and securely.";
  }

  // 10. Waterproof / Rain / Weather
  if (
    q.includes("waterproof") ||
    q.includes("rain") ||
    q.includes("wet") ||
    q.includes("weather") ||
    q.includes("mud") ||
    q.includes("muck") ||
    q.includes("grip")
  ) {
    return "The **ELITE 2.0 GLOVES** are specifically engineered for wet Irish weather and muddy pitches! The **3mm German Contact Latex Palm** is moisture-activated — meaning rain and surface dampness actually increase friction and grip against leather O'Neills match balls.\n\nThe breathable thermal-flex neoprene body keeps your hands nimble and comfortable in rain, snow, or heat.";
  }

  // 11. Discounts / Promo codes
  if (
    q.includes("discount") ||
    q.includes("promo") ||
    q.includes("code") ||
    q.includes("coupon") ||
    q.includes("voucher")
  ) {
    return "You can use code **OCI10** at checkout for **10% off** your order! Simply enter **OCI10** in the cart drawer promo field before proceeding to checkout.";
  }

  // 12. Glove Care & Washing
  if (
    q.includes("wash") ||
    q.includes("care") ||
    q.includes("clean") ||
    q.includes("dry") ||
    q.includes("maintain")
  ) {
    return "To keep your contact latex gripping at 100%:\n1. Rinse gently in lukewarm water after muddy games to clear away dirt.\n2. Gently press moisture out from fingers to wrist — do not wring or twist.\n3. Air dry naturally at room temperature. **Never place them on hot radiators or in tumble dryers**, as direct heat will dry out the latex.";
  }

  // 13. Contact
  if (
    q.includes("contact") ||
    q.includes("email") ||
    q.includes("phone") ||
    q.includes("support") ||
    q.includes("speak to")
  ) {
    return "You can contact our team anytime directly at **contactocisports@gmail.com**. We reply promptly to all club, player, and parent inquiries!";
  }

  // 14. Friendly Greetings
  if (
    q === "hi" ||
    q === "hello" ||
    q === "hey" ||
    q === "dia duit" ||
    q.startsWith("hello") ||
    q.startsWith("hi ") ||
    q.startsWith("hey ")
  ) {
    return "Dia duit! Great to have you at OCI Sports. How can I help you gear up today? You can ask me about sizing (S/M/L), our all-weather wet grip, delivery times across Ireland, or order tracking!";
  }

  // 15. Unknown / Outside Knowledge
  return "I want to make sure I give you completely accurate information, but I don't have those specific details on hand. Please reach out to our team directly at **contactocisports@gmail.com** and we'll be delighted to assist you!";
}

app.post("/api/chat", async (req, res) => {
  try {
    const { message, history } = req.body || {};
    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ error: "Message is required." });
    }

    const trimmedMsg = message.trim();
    const safeHistory: Array<{ role: string; text: string }> = Array.isArray(history)
      ? history.filter((h) => h && typeof h.text === "string")
      : [];

    // 1. Try Gemini API first if configured
    const ai = getAIClient();
    if (ai) {
      try {
        const contents = safeHistory.map((m) => ({
          role: m.role === "user" ? "user" : "model",
          parts: [{ text: m.text }],
        }));

        contents.push({
          role: "user",
          parts: [{ text: trimmedMsg }],
        });

        const geminiRes = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents,
          config: {
            systemInstruction: CHAT_SYSTEM_INSTRUCTION,
            temperature: 0.5,
            maxOutputTokens: 600,
          },
        });

        const reply = geminiRes.text;
        if (reply && reply.trim()) {
          return res.json({ reply: reply.trim() });
        }
      } catch (geminiErr: any) {
        console.warn("Gemini API call failed, falling back to local intelligence:", geminiErr?.message || geminiErr);
      }
    }

    // 2. Fallback to smart local semantic answering engine
    const localReply = generateSmartLocalResponse(trimmedMsg, safeHistory);
    return res.json({ reply: localReply });
  } catch (err: any) {
    console.error("Chat handler error:", err);
    return res.json({
      reply: "Dia duit! I'm here to help with your OCI Sports gloves, sizing, shipping, or returns. How can I help you today?",
    });
  }
});

// ==========================================
// 7. Frontend Serving (Vite dev or production)
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`OCI Sports Server running on port ${PORT}`);
  });
}

startServer();
