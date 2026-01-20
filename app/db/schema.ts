import { mysqlTable, int, varchar, text, timestamp, boolean, longtext } from 'drizzle-orm/mysql-core';

// Admin Users
export const adminUsers = mysqlTable('admin_users', {
  id: int('id').primaryKey().autoincrement(),
  username: varchar('username', { length: 100 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(), // hashed
  email: varchar('email', { length: 255 }).notNull().unique(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

// Site Settings (general site info)
export const siteSettings = mysqlTable('site_settings', {
  id: int('id').primaryKey().autoincrement(),
  companyName: varchar('company_name', { length: 255 }).notNull(),
  companyAddress: text('company_address').notNull(),
  companyPhone: varchar('company_phone', { length: 50 }).notNull(),
  companyEmail: varchar('company_email', { length: 255 }).notNull(),
  companyFacebook: varchar('company_facebook', { length: 255 }),
  companyTwitter: varchar('company_twitter', { length: 255 }),
  companyInstagram: varchar('company_instagram', { length: 255 }),
  logoImage: varchar('logo_image', { length: 255 }),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

// About Us Content
export const aboutUs = mysqlTable('about_us', {
  id: int('id').primaryKey().autoincrement(),
  title: varchar('title', { length: 255 }).notNull(),
  paragraph1: text('paragraph1').notNull(),
  paragraph2: text('paragraph2').notNull(),
  paragraph3: text('paragraph3').notNull(),
  paragraph4: text('paragraph4').notNull(),
  paragraph5: text('paragraph5').notNull(),
  missionTitle: varchar('mission_title', { length: 255 }).notNull(),
  missionText: text('mission_text').notNull(),
  visionTitle: varchar('vision_title', { length: 255 }).notNull(),
  visionText: text('vision_text').notNull(),
  galleryImage: varchar('gallery_image', { length: 255 }),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

// About Us Gallery Images (scrolling gallery list)
export const aboutUsGalleryImages = mysqlTable('about_us_gallery_images', {
  id: int('id').primaryKey().autoincrement(),
  image: varchar('image', { length: 255 }).notNull(),
  alt: varchar('alt', { length: 255 }).notNull().default('About Us gallery image'),
  displayOrder: int('display_order').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

// Board Members
export const boardMembers = mysqlTable('board_members', {
  id: int('id').primaryKey().autoincrement(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  position: varchar('position', { length: 100 }).notNull(),
  image: varchar('image', { length: 255 }).notNull(),
  displayOrder: int('display_order').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

// Board of Directors Section Settings
export const boardSettings = mysqlTable('board_settings', {
  id: int('id').primaryKey().autoincrement(),
  footerText: text('footer_text').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

// Services
export const services = mysqlTable('services', {
  id: int('id').primaryKey().autoincrement(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  icon: varchar('icon', { length: 255 }).notNull(),
  displayOrder: int('display_order').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

// Service Ticker Items
export const tickerItems = mysqlTable('ticker_items', {
  id: int('id').primaryKey().autoincrement(),
  text: varchar('text', { length: 255 }).notNull(),
  displayOrder: int('display_order').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

// Statistics (By the Numbers)
export const statistics = mysqlTable('statistics', {
  id: int('id').primaryKey().autoincrement(),
  label: varchar('label', { length: 100 }).notNull(),
  value: varchar('value', { length: 50 }).notNull(),
  displayOrder: int('display_order').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

// Projects
export const projects = mysqlTable('projects', {
  id: int('id').primaryKey().autoincrement(),
  title: varchar('title', { length: 255 }).notNull(),
  year: varchar('year', { length: 4 }).notNull(),
  subtitle: varchar('subtitle', { length: 255 }).notNull(),
  description: text('description').notNull(),
  category: varchar('category', { length: 50 }).notNull(), // desktop, mobile, tools
  thumbnail: varchar('thumbnail', { length: 255 }),
  screenshot1: varchar('screenshot1', { length: 255 }),
  screenshot2: varchar('screenshot2', { length: 255 }),
  screenshot3: varchar('screenshot3', { length: 255 }),
  screenshot4: varchar('screenshot4', { length: 255 }),
  displayOrder: int('display_order').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

// Team Members
export const teamMembers = mysqlTable('team_members', {
  id: int('id').primaryKey().autoincrement(),
  name: varchar('name', { length: 255 }).notNull(),
  position: varchar('position', { length: 255 }).notNull(),
  image: varchar('image', { length: 255 }),
  displayOrder: int('display_order').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

// Shop Categories
export const shopCategories = mysqlTable('shop_categories', {
  id: int('id').primaryKey().autoincrement(),
  name: varchar('name', { length: 255 }).notNull(),
  text: varchar('text', { length: 255 }).notNull(), // Display text (can be different from name)
  image: varchar('image', { length: 255 }).notNull(),
  displayOrder: int('display_order').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

// Shop Content
export const shopContent = mysqlTable('shop_content', {
  id: int('id').primaryKey().autoincrement(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  salesIcon: varchar('sales_icon', { length: 255 }),
  authorizedDealerImage: varchar('authorized_dealer_image', { length: 255 }),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

// Authorized Dealers (Brand Logos)
export const authorizedDealers = mysqlTable('authorized_dealers', {
  id: int('id').primaryKey().autoincrement(),
  name: varchar('name', { length: 255 }).notNull(),
  image: varchar('image', { length: 255 }).notNull(), // Image ID from images table
  displayOrder: int('display_order').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

// Hero Section (Main logos and content)
export const heroSection = mysqlTable('hero_section', {
  id: int('id').primaryKey().autoincrement(),
  weMakeItLogo: varchar('we_make_it_logo', { length: 255 }),
  isLogo: varchar('is_logo', { length: 255 }),
  fullLogo: varchar('full_logo', { length: 255 }),
  backgroundImage: varchar('background_image', { length: 255 }),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

// Hero Ticker Items (Text scrolling ticker)
export const heroTickerItems = mysqlTable('hero_ticker_items', {
  id: int('id').primaryKey().autoincrement(),
  text: varchar('text', { length: 500 }).notNull(),
  displayOrder: int('display_order').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

// Contact Messages (Inbox)
export const contactMessages = mysqlTable('contact_messages', {
  id: int('id').primaryKey().autoincrement(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  contactNo: varchar('contact_no', { length: 50 }).notNull(),
  message: text('message').notNull(),
  // Optional link to a specific project inquiry
  projectId: int('project_id'),
  projectTitle: varchar('project_title', { length: 255 }),
  status: varchar('status', { length: 50 }).notNull().default('new'), // new, read, replied, archived
  adminNotes: text('admin_notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

// Images Storage (Store images as base64 in database)
export const images = mysqlTable('images', {
  id: int('id').primaryKey().autoincrement(),
  filename: varchar('filename', { length: 255 }).notNull(),
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  size: int('size').notNull(),
  data: longtext('data').notNull(), // Base64 encoded image data
  createdAt: timestamp('created_at').defaultNow(),
});

// What We Do Section - Main Content
export const whatWeDo = mysqlTable('what_we_do', {
  id: int('id').primaryKey().autoincrement(),
  mainText: text('main_text').notNull(),
  tagline: text('tagline').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

// What We Do Images (images for the carousel)
export const whatWeDoImages = mysqlTable('what_we_do_images', {
  id: int('id').primaryKey().autoincrement(),
  image: varchar('image', { length: 255 }).notNull(),
  alt: varchar('alt', { length: 255 }).notNull().default('What we do image'),
  displayOrder: int('display_order').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

// Featured App Section - Main Configuration
export const featuredApp = mysqlTable('featured_app', {
  id: int('id').primaryKey().autoincrement(),
  headerImage: varchar('header_image', { length: 255 }), // Kept for backward compatibility
  itemType: varchar('item_type', { length: 50 }).default('app'), // 'app' or 'website'
  downloadText: varchar('download_text', { length: 255 }),
  appStoreImage: varchar('app_store_image', { length: 255 }),
  googlePlayImage: varchar('google_play_image', { length: 255 }),
  appGalleryImage: varchar('app_gallery_image', { length: 255 }),
  visitText: varchar('visit_text', { length: 255 }),
  websiteUrl: varchar('website_url', { length: 500 }), // URL for website hyperlink
  logoImage: varchar('logo_image', { length: 255 }),
  // New banner customization fields
  gradientFrom: varchar('gradient_from', { length: 50 }).default('#2563eb'),
  gradientTo: varchar('gradient_to', { length: 50 }).default('#1e40af'),
  gradientDirection: varchar('gradient_direction', { length: 20 }).default('to-r'),
  appLogo: varchar('app_logo', { length: 255 }),
  bannerHeight: varchar('banner_height', { length: 20 }).default('h-64'),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

// Featured App Carousel Images
export const featuredAppCarouselImages = mysqlTable('featured_app_carousel_images', {
  id: int('id').primaryKey().autoincrement(),
  image: varchar('image', { length: 255 }).notNull(),
  alt: varchar('alt', { length: 255 }).notNull().default('Featured app carousel image'),
  displayOrder: int('display_order').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

// Featured App Features (for banner feature icons)
export const featuredAppFeatures = mysqlTable('featured_app_features', {
  id: int('id').primaryKey().autoincrement(),
  featuredAppId: int('featured_app_id').notNull(),
  iconImage: varchar('icon_image', { length: 255 }).notNull(),
  label: varchar('label', { length: 100 }).notNull(),
  displayOrder: int('display_order').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});
