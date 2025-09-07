// components/crud/configs.ts
import { CrudConfig } from './CrudPanel';

const TARGET_GENDERS = ['womens', 'mens', 'unisex', 'kids', 'unknown'] as const;
const COLORING_PALETTES = ['spring','summer','autumn','winter','neutral','unknown'] as const;
const SKIN_UNDERTONES = ['cool','warm','neutral','unknown'] as const;
const ITEM_STATUS = ['owned','wishlist','donated','returned','tailor','archived'] as const;
const SIZE_SYSTEMS = ['us', 'uk', 'eu', 'jp', 'alpha', 'custom'] as const;
const MEDIA_KINDS = ['image', 'video', 'url'] as const;

export const VendorsConfig: CrudConfig = {
  title: 'Vendors',
  subtitle: 'Brands, boutiques, suppliers',
  table: 'vendors',
  orderBy: { column: 'name' },
  fields: [
    { key: 'name', label: 'Name', kind: 'text', required: true },
    { key: 'website_url', label: 'Website', kind: 'text' },
    { key: 'contact_name', label: 'Contact Name', kind: 'text' },
    { key: 'contact_email', label: 'Contact Email', kind: 'text' },
    { key: 'contact_phone', label: 'Contact Phone', kind: 'text' },
    { key: 'wholesale', label: 'Wholesale', kind: 'checkbox', default: false },
    { key: 'notes', label: 'Notes', kind: 'textarea', hideInList: true },
  ],
  searchKeys: ['name','contact_name','contact_email','website_url'],
  listCols: ['name','website_url','contact_name','wholesale'],
};

export const ProductsConfig: CrudConfig = {
  title: 'Products',
  subtitle: 'Create and update product styles (variants managed elsewhere)',
  table: 'products',
  listSelect: '*, vendors(name)',
  orderBy: { column: 'created_at', ascending: false },
  limit: 200,
  fields: [
    { key: 'vendor_id', label: 'Vendor', kind: 'fk', required: true, fk: { table: 'vendors', valueKey: 'id', labelKey: 'name', orderBy: 'name' } },
    { key: 'name', label: 'Product Name', kind: 'text', required: true },
    { key: 'category', label: 'Category', kind: 'text' },
    { key: 'subcategory', label: 'Subcategory', kind: 'text' },
    { key: 'target_gender', label: 'Target Gender', kind: 'select', options: TARGET_GENDERS.map(g => ({ value: g, label: g })) },
    { key: 'base_color', label: 'Base Color', kind: 'text' },
    { key: 'material', label: 'Material', kind: 'text' },
    { key: 'care', label: 'Care', kind: 'text' },
    { key: 'msrp', label: 'MSRP', kind: 'money' },
    { key: 'currency', label: 'Currency', kind: 'text', default: 'USD' },
    { key: 'external_handle', label: 'External Handle', kind: 'text' },
    { key: 'search_tags', label: 'Search Tags', kind: 'tags', hideInList: true },
    { key: 'description', label: 'Description', kind: 'textarea', hideInList: true },
  ],
  searchKeys: ['name','category','subcategory','base_color'],
  listCols: ['name','vendor_id','category','target_gender','base_color','msrp'],
};

export const PersonasConfig: CrudConfig = {
  title: 'Personas',
  subtitle: 'Clients you style',
  table: 'personas',
  orderBy: { column: 'display_name' },
  fields: [
    { key: 'user_id', label: 'User ID', kind: 'text', hideInList: true },
    { key: 'display_name', label: 'Display Name', kind: 'text', required: true },
    { key: 'birth_date', label: 'Birth Date', kind: 'date' },
    { key: 'coloring', label: 'Coloring', kind: 'select', options: COLORING_PALETTES.map(p => ({ value: p, label: p })), default: 'unknown' },
    { key: 'undertone', label: 'Undertone', kind: 'select', options: SKIN_UNDERTONES.map(u => ({ value: u, label: u })), default: 'unknown' },
    { key: 'eye_color', label: 'Eye Color', kind: 'text' },
    { key: 'hair_color', label: 'Hair Color', kind: 'text' },
    { key: 'skin_tone', label: 'Skin Tone', kind: 'text' },
    { key: 'body_shape', label: 'Body Shape', kind: 'text' },
    { key: 'style_keywords', label: 'Style Keywords', kind: 'tags' },
    { key: 'brand_prefs', label: 'Brand Preferences', kind: 'tags' },
    { key: 'notes', label: 'Notes', kind: 'textarea', hideInList: true },
  ],
  searchKeys: ['display_name','eye_color','hair_color','skin_tone','body_shape'],
  listCols: ['display_name','coloring','undertone','body_shape'],
};

export const OutfitsConfig: CrudConfig = {
  title: 'Outfits',
  subtitle: 'Compose looks for a persona (attach wardrobe items separately)',
  table: 'outfits',
  listSelect: '*, personas(display_name)',
  orderBy: { column: 'created_at', ascending: false },
  limit: 200,
  fields: [
    { key: 'persona_id', label: 'Persona', kind: 'fk', required: true, fk: { table: 'personas', valueKey: 'id', labelKey: 'display_name', orderBy: 'display_name' } },
    { key: 'title', label: 'Title', kind: 'text', required: true },
    { key: 'notes', label: 'Notes', kind: 'textarea', hideInList: true },
  ],
  searchKeys: ['title'],
  listCols: ['title','persona_id'],
};

export const WardrobeItemsConfig: CrudConfig = {
  title: 'Wardrobe Items',
  subtitle: 'Individual items in wardrobes',
  table: 'wardrobe_items',
  listSelect: '*, wardrobes(title), products(name), product_variants(size_label, color)',
  orderBy: { column: 'created_at', ascending: false },
  limit: 200,
  fields: [
    { key: 'wardrobe_id', label: 'Wardrobe', kind: 'fk', required: true, fk: { table: 'wardrobes', valueKey: 'id', labelKey: 'title', orderBy: 'title' } },
    { key: 'product_id', label: 'Product', kind: 'fk', fk: { table: 'products', valueKey: 'id', labelKey: 'name', orderBy: 'name' } },
    { key: 'variant_id', label: 'Product Variant', kind: 'fk', fk: { table: 'product_variants', valueKey: 'id', labelKey: 'size_label', orderBy: 'size_label' } },
    { key: 'status', label: 'Status', kind: 'select', options: ITEM_STATUS.map(s => ({ value: s, label: s })), default: 'owned' },
    { key: 'acquired_on', label: 'Acquired On', kind: 'date' },
    { key: 'purchase_price', label: 'Purchase Price', kind: 'money' },
    { key: 'currency', label: 'Currency', kind: 'text', default: 'USD' },
    { key: 'condition', label: 'Condition', kind: 'text' },
    { key: 'fit_rating', label: 'Fit Rating (1-5)', kind: 'number' },
    { key: 'tailor_notes', label: 'Tailor Notes', kind: 'textarea', hideInList: true },
    { key: 'style_tags', label: 'Style Tags', kind: 'tags' },
    { key: 'notes', label: 'Notes', kind: 'textarea', hideInList: true },
  ],
  searchKeys: ['style_tags', 'notes', 'condition'],
  listCols: ['wardrobe_id','product_id','variant_id','status','purchase_price','fit_rating'],
};

export const PersonaMeasurementsConfig: CrudConfig = {
  title: 'Persona Measurements',
  subtitle: 'Measurements for personas',
  table: 'persona_measurements',
  listSelect: '*, personas(display_name)',
  orderBy: { column: 'name' },
  fields: [
    { key: 'persona_id', label: 'Persona', kind: 'fk', required: true, fk: { table: 'personas', valueKey: 'id', labelKey: 'display_name', orderBy: 'display_name' } },
    { key: 'name', label: 'Measurement Name', kind: 'text', required: true },
    { key: 'value_cm', label: 'Value (cm)', kind: 'number', required: true },
    { key: 'taken_on', label: 'Taken On', kind: 'date' },
    { key: 'notes', label: 'Notes', kind: 'textarea', hideInList: true },
  ],
  searchKeys: ['name'],
  listCols: ['persona_id','name','value_cm','taken_on'],
};

export const PersonaPreferencesConfig: CrudConfig = {
  title: 'Persona Preferences',
  subtitle: 'Preferences for personas',
  table: 'persona_preferences',
  listSelect: '*, personas(display_name)',
  orderBy: { column: 'priority', ascending: false },
  fields: [
    { key: 'persona_id', label: 'Persona', kind: 'fk', required: true, fk: { table: 'personas', valueKey: 'id', labelKey: 'display_name', orderBy: 'display_name' } },
    { key: 'pref_key', label: 'Preference Key', kind: 'text', required: true },
    { key: 'pref_value', label: 'Preference Value (JSON)', kind: 'textarea', required: true },
    { key: 'priority', label: 'Priority', kind: 'number', default: 0 },
  ],
  searchKeys: ['pref_key'],
  listCols: ['persona_id','pref_key','priority'],
};

export const ProductVariantsConfig: CrudConfig = {
  title: 'Product Variants',
  subtitle: 'Size/color variations of products',
  table: 'product_variants',
  listSelect: '*, products(name)',
  orderBy: { column: 'created_at', ascending: false },
  limit: 200,
  fields: [
    { key: 'product_id', label: 'Product', kind: 'fk', required: true, fk: { table: 'products', valueKey: 'id', labelKey: 'name', orderBy: 'name' } },
    { key: 'sku', label: 'SKU', kind: 'text' },
    { key: 'barcode', label: 'Barcode', kind: 'text' },
    { key: 'size_system', label: 'Size System', kind: 'select', options: SIZE_SYSTEMS.map(s => ({ value: s, label: s })), default: 'custom' },
    { key: 'size_label', label: 'Size Label', kind: 'text' },
    { key: 'numeric_size', label: 'Numeric Size', kind: 'number' },
    { key: 'color', label: 'Color', kind: 'text' },
    { key: 'length_label', label: 'Length Label', kind: 'text' },
    { key: 'rise_label', label: 'Rise Label', kind: 'text' },
    { key: 'fit_notes', label: 'Fit Notes', kind: 'textarea', hideInList: true },
    { key: 'active', label: 'Active', kind: 'checkbox', default: true },
  ],
  searchKeys: ['sku','barcode','size_label','color'],
  listCols: ['product_id','sku','size_label','color','active'],
};

export const InventoryConfig: CrudConfig = {
  title: 'Inventory',
  subtitle: 'Stock levels and pricing',
  table: 'inventory',
  listSelect: '*, product_variants(size_label, color), vendors(name)',
  orderBy: { column: 'last_synced_at', ascending: false },
  limit: 200,
  fields: [
    { key: 'variant_id', label: 'Product Variant', kind: 'fk', required: true, fk: { table: 'product_variants', valueKey: 'id', labelKey: 'size_label', orderBy: 'size_label' } },
    { key: 'vendor_id', label: 'Vendor', kind: 'fk', fk: { table: 'vendors', valueKey: 'id', labelKey: 'name', orderBy: 'name' } },
    { key: 'quantity_on_hand', label: 'Quantity On Hand', kind: 'number', required: true, default: 0 },
    { key: 'cost', label: 'Cost', kind: 'money' },
    { key: 'price', label: 'Price', kind: 'money' },
    { key: 'currency', label: 'Currency', kind: 'text', default: 'USD' },
    { key: 'location', label: 'Location', kind: 'text' },
    { key: 'last_synced_at', label: 'Last Synced', kind: 'text', hideInList: true },
  ],
  searchKeys: ['location'],
  listCols: ['variant_id','vendor_id','quantity_on_hand','cost','price','location'],
};

export const MediaAssetsConfig: CrudConfig = {
  title: 'Media Assets',
  subtitle: 'Images, videos, and links for products',
  table: 'media_assets',
  listSelect: '*, products(name), product_variants(size_label, color)',
  orderBy: { column: 'position' },
  fields: [
    { key: 'product_id', label: 'Product', kind: 'fk', fk: { table: 'products', valueKey: 'id', labelKey: 'name', orderBy: 'name' } },
    { key: 'variant_id', label: 'Product Variant', kind: 'fk', fk: { table: 'product_variants', valueKey: 'id', labelKey: 'size_label', orderBy: 'size_label' } },
    { key: 'kind', label: 'Media Type', kind: 'select', options: MEDIA_KINDS.map(k => ({ value: k, label: k })), required: true, default: 'image' },
    { key: 'url', label: 'URL', kind: 'text', required: true },
    { key: 'alt', label: 'Alt Text', kind: 'text' },
    { key: 'is_primary', label: 'Is Primary', kind: 'checkbox', default: false },
    { key: 'position', label: 'Position', kind: 'number', default: 0 },
  ],
  searchKeys: ['url','alt'],
  listCols: ['product_id','variant_id','kind','url','is_primary','position'],
};

export const WardrobesConfig: CrudConfig = {
  title: 'Wardrobes',
  subtitle: 'Collections of items for personas',
  table: 'wardrobes',
  listSelect: '*, personas(display_name)',
  orderBy: { column: 'title' },
  fields: [
    { key: 'persona_id', label: 'Persona', kind: 'fk', required: true, fk: { table: 'personas', valueKey: 'id', labelKey: 'display_name', orderBy: 'display_name' } },
    { key: 'title', label: 'Title', kind: 'text', required: true },
    { key: 'is_active', label: 'Is Active', kind: 'checkbox', default: true },
    { key: 'notes', label: 'Notes', kind: 'textarea', hideInList: true },
  ],
  searchKeys: ['title'],
  listCols: ['persona_id','title','is_active'],
};

export const OutfitItemsConfig: CrudConfig = {
  title: 'Outfit Items',
  subtitle: 'Items within outfits',
  table: 'outfit_items',
  listSelect: '*, outfits(title), wardrobe_items(id)',
  orderBy: { column: 'position' },
  fields: [
    { key: 'outfit_id', label: 'Outfit', kind: 'fk', required: true, fk: { table: 'outfits', valueKey: 'id', labelKey: 'title', orderBy: 'title' } },
    { key: 'wardrobe_item_id', label: 'Wardrobe Item', kind: 'fk', required: true, fk: { table: 'wardrobe_items', valueKey: 'id', labelKey: 'id', orderBy: 'created_at' } },
    { key: 'role', label: 'Role', kind: 'text' },
    { key: 'position', label: 'Position', kind: 'number', default: 0 },
  ],
  searchKeys: ['role'],
  listCols: ['outfit_id','wardrobe_item_id','role','position'],
};
