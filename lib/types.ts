// lib/types.ts
export type UUID = string;

export type ColoringPalette = 'spring' | 'summer' | 'autumn' | 'winter' | 'neutral' | 'unknown';
export type SkinUndertone = 'cool' | 'warm' | 'neutral' | 'unknown';
export type TargetGender = 'womens' | 'mens' | 'unisex' | 'kids' | 'unknown';
export type ItemStatus = 'owned' | 'wishlist' | 'donated' | 'returned' | 'tailor' | 'archived';
export type SizeSystem = 'us' | 'uk' | 'eu' | 'jp' | 'alpha' | 'custom';
export type MediaKind = 'image' | 'video' | 'url';

export type Persona = {
  id: UUID;
  user_id: UUID | null;
  display_name: string;
  birth_date: string | null;
  coloring: ColoringPalette;
  undertone: SkinUndertone;
  eye_color: string | null;
  hair_color: string | null;
  skin_tone: string | null;
  body_shape: string | null;
  style_keywords: string[];
  brand_prefs: string[];
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type PersonaMeasurement = {
  id: UUID;
  persona_id: UUID;
  name: string;
  value_cm: number;
  taken_on: string | null;
  notes: string | null;
};

export type PersonaPreference = {
  id: UUID;
  persona_id: UUID;
  pref_key: string;
  pref_value: any;
  priority: number | null;
};

export type Vendor = {
  id: UUID;
  name: string;
  website_url: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  wholesale: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type Product = {
  id: UUID;
  vendor_id: UUID;
  name: string;
  description: string | null;
  category: string | null;
  subcategory: string | null;
  target_gender: TargetGender;
  material: string | null;
  care: string | null;
  base_color: string | null;
  msrp: number | null;
  currency: string | null;
  external_handle: string | null;
  search_tags: string[];
  created_at: string;
  updated_at: string;
};

export type ProductVariant = {
  id: UUID;
  product_id: UUID;
  sku: string | null;
  barcode: string | null;
  size_system: SizeSystem | null;
  size_label: string | null;
  numeric_size: number | null;
  color: string | null;
  length_label: string | null;
  rise_label: string | null;
  fit_notes: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type Inventory = {
  id: UUID;
  variant_id: UUID;
  vendor_id: UUID | null;
  quantity_on_hand: number;
  cost: number | null;
  price: number | null;
  currency: string | null;
  location: string | null;
  last_synced_at: string | null;
};

export type MediaAsset = {
  id: UUID;
  product_id: UUID | null;
  variant_id: UUID | null;
  kind: MediaKind;
  url: string;
  alt: string | null;
  is_primary: boolean;
  position: number | null;
};

export type Wardrobe = {
  id: UUID;
  persona_id: UUID;
  title: string;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type WardrobeItem = {
  id: UUID;
  wardrobe_id: UUID;
  product_id: UUID | null;
  variant_id: UUID | null;
  status: ItemStatus;
  acquired_on: string | null;
  purchase_price: number | null;
  currency: string | null;
  condition: string | null;
  fit_rating: number | null;
  tailor_notes: string | null;
  style_tags: string[];
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type Outfit = {
  id: UUID;
  persona_id: UUID;
  title: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type OutfitItem = {
  id: UUID;
  outfit_id: UUID;
  wardrobe_item_id: UUID;
  role: string | null;
  position: number | null;
};

