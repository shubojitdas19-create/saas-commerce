/**
 * SaaS Commerce - Tenant Assistant Knowledge & Store Profiles
 * 
 * Provides domain-specific business profiles, customer personas, frontend route maps,
 * and variant/specification recommendations for each merchant tenant.
 */

export const ASSISTANT_NAME = "Vanij AI";

export interface StoreProfile {
  storeName: string;
  slug: string;
  vertical: string;
  description: string;
  targetAudience: string;
  frontendProject: string;
  frontendRoutes: { route: string; purpose: string }[];
  variantAdvice: string;
  specificationAdvice: string;
  orderWorkflow: string;
}

export const KNOWN_STORE_PROFILES: Record<string, StoreProfile> = {
  "the-colour-world": {
    storeName: "The Colour World",
    slug: "the-colour-world",
    vertical: "Retail Paints, Textures, Waterproofing & Home Surface Decor",
    description: "Premium dealer of Asian Paints, Berger, Birla Opus, waterproofing solutions, and designer wall textures.",
    targetAudience: "Homeowners, interior decorators, architects, painting contractors, and commercial builders.",
    frontendProject: "d:\\Projects\\the-colour-world (Next.js 16 storefront)",
    frontendRoutes: [
      { route: "/", purpose: "Hero showcase, brand highlights, bestsellers, and consultation hooks" },
      { route: "/shop", purpose: "Catalog listing with category, brand, and price filters" },
      { route: "/shop/[slug]", purpose: "Product detail with pack sizes, finish specs, and add-to-cart/inquiry" },
      { route: "/textures", purpose: "Curated designer wall textures and finish catalog" },
      { route: "/colour-studio", purpose: "Visual shade selector & color inspiration explorer" },
      { route: "/consultation", purpose: "Lead capture for free painting measurement & home consultation" },
      { route: "/reviews", purpose: "Live Google Places verified reviews + internal customer feedback" },
      { route: "/checkout", purpose: "Order/quote submission with address & contact details" }
    ],
    variantAdvice: "Paint products MUST use pack size volumes as variants: '1 Litre', '4 Litres', '10 Litres', '20 Litres' (or '1 Kg', '5 Kg', '20 Kg' for putties and waterproofing powders). Provide a priceOverride for each volume.",
    specificationAdvice: "Specifications should include: Sheen/Finish (Matt, Gloss, Silk, Satin), Coverage Area (e.g. 120-140 sq ft/Litre for 2 coats), Recommended Dilution, Drying Time, Washability Level, and Recommended Primer/Undercoat.",
    orderWorkflow: "This store is QUOTE-BASED (isQuoteBased = true). Customers place quote orders or consultations. The store owner can open Orders -> Order Details, update line-item quote prices if needed, and accept/dispatch."
  },

  "boihut": {
    storeName: "বইhut (BoiHut)",
    slug: "boihut",
    vertical: "Bengali Books, Literature, Poetry, Novels & Academic Publishing",
    description: "Extensive online Bengali bookstore offering fiction, non-fiction, classic literature, translated works, and children's books.",
    targetAudience: "Bengali readers, book lovers, students, researchers, and Bengali diaspora worldwide.",
    frontendProject: "d:\\Projects\\boihut-next (Next.js 16 storefront)",
    frontendRoutes: [
      { route: "/", purpose: "Homepage with bestselling books, new releases, and publisher carousels" },
      { route: "/shop", purpose: "Searchable catalog with author, publisher, genre, and price filters" },
      { route: "/shop/[slug]", purpose: "Book details page showing cover, author info, specifications, and COD buy button" },
      { route: "/publishers", purpose: "Index of famous publishing houses (Ananda, Dey's, Mitra & Ghosh, etc.)" },
      { route: "/collections", purpose: "Themed book collections (Rabindra Sahitya, Feluda, Byomkesh, etc.)" },
      { route: "/cart", purpose: "Shopping cart with item quantities" },
      { route: "/checkout", purpose: "Cash-on-Delivery (COD) and fast shipping address form" }
    ],
    variantAdvice: "Books typically have binding variants: 'Paperback (পেপারব্যাক)', 'Hardcover (হার্ডকভার)', or 'Deluxe Edition'. If the book has only one binding, use a single 'Paperback' variant.",
    specificationAdvice: "Essential specifications: Author (লেখক), Publisher (প্রকাশক), Language (বাংলা / English), ISBN, Edition / Year (সংস্করণ / প্রকাশ সাল), Number of Pages (পৃষ্ঠা সংখ্যা), and Translator (অনুবাদক, if applicable).",
    orderWorkflow: "Direct e-commerce with Cash on Delivery (COD). Orders flow as: Pending -> Accepted -> Dispatched -> Delivered."
  },

  "rabines-stores": {
    storeName: "Rabines Stores",
    slug: "rabines-stores",
    vertical: "Industrial CNC Machine Tooling, Lathe Accessories & Hardware",
    description: "B2B and technical B2C supplier of CNC tool holders, shaft jaws, boring bars, carbide inserts, and heavy-duty machine accessories.",
    targetAudience: "Machinists, manufacturing workshop owners, CNC lathe operators, and industrial fabricators.",
    frontendProject: "d:\\Projects\\rabines-stores-next (Next.js storefront)",
    frontendRoutes: [
      { route: "/", purpose: "High-impact industrial hero, fast-moving spares, and instant WhatsApp quote CTA" },
      { route: "/shop", purpose: "Technical tool catalog filterable by Tool Type, Material Grade, and Size" },
      { route: "/shop/[slug]", purpose: "Precision specification tables (SpecTable) with dual action: Add to Cart & WhatsApp Quote" },
      { route: "/services", purpose: "Custom jaw modification and tooling consulting" },
      { route: "/checkout", purpose: "Direct B2B hardware checkout" }
    ],
    variantAdvice: "Tooling variants must match technical machining specs: Shank Dimensions (e.g. '16x16 mm', '20x20 mm', '25x25 mm'), Chuck Jaw Diameter ('8 inch', '10 inch', '12 inch'), or Boring Bar Diameter ('12 mm', '16 mm').",
    specificationAdvice: "Machinists buy on precision, not marketing prose. Specifications MUST include: Insert Compatibility (e.g. CNMG 120408, WNMG 080408), Material Grade (High Carbon Steel, Carbide), Hardness (HRC), Clamping Mechanism (Screw Lock / Wedge Lock), Hand Direction (Right Hand, Left Hand).",
    orderWorkflow: "Dual conversion model: Single unit purchases can be checked out directly; bulk orders trigger WhatsApp inquiries to +91 9002156266."
  },

  "abhays-roof-garden": {
    storeName: "Abhays Roof Garden",
    slug: "abhays-roof-garden",
    vertical: "Terrace Gardening, Exotic Plants, Nursery & Organic Plant Care",
    description: "Online plant nursery selling ornamental plants, fruit saplings, terrace gardening supplies, planters, and organic fertilizers.",
    targetAudience: "Urban terrace gardeners, plant parents, balcony gardening enthusiasts, and landscapers.",
    frontendProject: "d:\\Projects\\abhays-garden (Next.js storefront)",
    frontendRoutes: [
      { route: "/", purpose: "Greenery hero, plant collections, care guides, and seasonal highlights" },
      { route: "/shop", purpose: "Plant catalog filterable by Indoor/Outdoor, Sunlight Needs, and Plant Type" },
      { route: "/shop/[slug]", purpose: "Plant care guide, pot size options, and healthy live plant delivery guarantee" },
      { route: "/checkout", purpose: "Fast checkout with plant safety packaging" }
    ],
    variantAdvice: "Plants require pot/container size variants: 'Sapling in Polybag', '6-inch Nursery Pot', '8-inch Ceramic Pot', or '10-inch Planter'.",
    specificationAdvice: "Specifications must guide plant care: Sunlight Requirement (Full Sun, Semi-Shade, Indoor Bright), Watering Schedule (Daily, Alternate Days, When Soil is Dry), Plant Mature Height, Foliage Type, Season / Bloom Period.",
    orderWorkflow: "Direct e-commerce with safe packaging options. Orders tracked from Pending through Shipped."
  },

  "drcleanx": {
    storeName: "Dr CleanX",
    slug: "drcleanx",
    vertical: "Household Hygiene, Liquid Cleaners & Disinfectants",
    description: "Premium household and commercial cleaning chemical formulations, liquid detergents, dishwashers, and surface disinfectants.",
    targetAudience: "Homemakers, cleaning contractors, hospitals, schools, and commercial offices.",
    frontendProject: "d:\\Projects\\drcleanx-next (Next.js storefront)",
    frontendRoutes: [
      { route: "/", purpose: "Crisp aqua/white hero, germ-protection highlights, bestsellers" },
      { route: "/shop", purpose: "Cleaning product catalog by surface type (Floor, Glass, Bathroom, Kitchen, Laundry)" },
      { route: "/shop/[slug]", purpose: "Usage instructions, fragrance options, and bottle size variants" },
      { route: "/cart", purpose: "Cart management" },
      { route: "/checkout", purpose: "Direct consumer checkout" }
    ],
    variantAdvice: "Hygiene products need volume/weight variants: '500 ml Flip-Cap Bottle', '1 Litre Refill Pouch', '5 Litre Economy Can'.",
    specificationAdvice: "Key specifications: Fragrance (Citrus Lemon, Pine, Fresh Lavender), Surface Safety (Tiles, Marble, Granite, Glass), Disinfection Rate (Kills 99.9% Germs), pH Level, Dilution Guide.",
    orderWorkflow: "Standard B2C e-commerce checkout with direct COD and online payment options."
  },

  "indradhonu": {
    storeName: "Indradhonu Art Academy",
    slug: "indradhonu",
    vertical: "Fine Art Academy & Student Craftwork Gallery Store",
    description: "Hybrid institution offering drawing and fine arts admissions alongside an online gallery selling student-crafted artwork and handmade designs.",
    targetAudience: "Aspiring art students, parents, art collectors, interior home decorators, and gift buyers.",
    frontendProject: "d:\\Projects\\indradhonu-next (Next.js storefront)",
    frontendRoutes: [
      { route: "/", purpose: "Dual intent hero: Art courses & admissions alongside featured student masterpieces" },
      { route: "/shop", purpose: "Student Art Gallery filterable by Medium (Watercolor, Oil, Acrylic, Charcoal)" },
      { route: "/shop/[slug]", purpose: "Art pedestal display with artist student profile, frame options, and authenticity badge" },
      { route: "/checkout", purpose: "Secure artwork purchase checkout" }
    ],
    variantAdvice: "Artwork variants represent framing and presentation: 'Unframed Canvas Roll', 'Wooden Stretched Frame', 'Black Gallery Float Frame with Glass'.",
    specificationAdvice: "Specifications should celebrate the artist: Student Artist Name, Batch / Age Group, Art Medium (Acrylic on Canvas, Watercolor on Fabriano, Charcoal Sketch), Canvas Dimensions (Height x Width in inches), Orientation (Portrait, Landscape).",
    orderWorkflow: "Original handmade artworks are prepared and packaged with care. Store owner accepts order and ships."
  }
};

/**
 * Returns a tailored StoreProfile for the given store slug,
 * with an intelligent dynamic fallback for newly created tenants.
 */
export function getStoreProfile(storeSlug: string, liveStoreData?: any): StoreProfile {
  const normalizedSlug = storeSlug.toLowerCase().trim();
  
  if (KNOWN_STORE_PROFILES[normalizedSlug]) {
    return KNOWN_STORE_PROFILES[normalizedSlug];
  }

  // Dynamic profile for any new store registered through Super Admin
  const isQuote = liveStoreData?.isQuoteBased ?? false;
  const storeName = liveStoreData?.name || storeSlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  const currency = liveStoreData?.currency || "INR";

  return {
    storeName,
    slug: storeSlug,
    vertical: "Multi-Category E-Commerce & Retail",
    description: `${storeName} is a custom digital storefront powered by saas-commerce.`,
    targetAudience: "Customers looking for high-quality products and transparent pricing.",
    frontendProject: `Headless storefront connected via /api/storefront/${storeSlug}`,
    frontendRoutes: [
      { route: "/shop", purpose: "Product catalog listing with dynamic filters" },
      { route: "/shop/[slug]", purpose: "Product detail page with images, variants, and specifications" },
      { route: "/checkout", purpose: isQuoteBasedCheckoutPurpose(isQuote) },
      { route: "/reviews", purpose: "Verified customer testimonials" }
    ],
    variantAdvice: "Create variants based on Size, Pack Size, Color, or Material. Always provide an explicit price override and stock count for each option.",
    specificationAdvice: "Add clear key-value specifications that answer your customer's most common buying questions (e.g. Dimensions, Weight, Material, Warranty).",
    orderWorkflow: isQuote
      ? "This store is QUOTE-BASED. Incoming customer requests are treated as quotes. You can adjust line-item pricing before dispatching."
      : `Standard e-commerce flow in ${currency}. Orders arrive in 'Pending' status and can be accepted, dispatched, and marked delivered.`
  };
}

function isQuoteBasedCheckoutPurpose(isQuote: boolean) {
  return isQuote
    ? "Inquiry/Quote submission where customer requests pricing or consultation"
    : "Direct cart checkout with Cash-on-Delivery or online payment";
}
