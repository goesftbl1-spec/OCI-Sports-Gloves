import express from "express";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";

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
  GAACLUB20: 20, // 20% team/club discount
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

// PayPal configuration helper
const getPayPalConfig = () => {
  const clientId = process.env.PAYPAL_CLIENT_ID?.trim() || "";
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET?.trim() || "";
  const mode = (process.env.PAYPAL_MODE?.trim() || "sandbox").toLowerCase();
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
const ADMIN_PASSCODE = process.env.ADMIN_PASSCODE || "OCI2026";

function checkAdminAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const passcode = req.headers["x-admin-passcode"] || req.query.passcode;
  if (!passcode || passcode !== ADMIN_PASSCODE) {
    return res.status(401).json({
      error: "UNAUTHORIZED",
      message: "Owner passcode is required to access order and customer records.",
    });
  }
  next();
}

app.post("/api/admin/verify-passcode", (req, res) => {
  const { passcode } = req.body || {};
  if (passcode && String(passcode).trim() === ADMIN_PASSCODE) {
    return res.json({ success: true, authorized: true });
  }
  return res.status(401).json({ success: false, error: "Incorrect owner passcode." });
});

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
  res.json({ orders });
});

app.post("/api/orders", checkAdminAuth, (req, res) => {
  try {
    const order = req.body;
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
