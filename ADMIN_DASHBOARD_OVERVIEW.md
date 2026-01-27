# iSynergies Admin Dashboard - Visual Hierarchy & Page Descriptions

## Overall Layout Structure

### **Main Container**
- **Layout**: Fixed height viewport (`h-screen`), flexbox with sidebar + main content
- **Background**: White (`bg-white`) with muted background for main content area (`bg-muted/40`)
- **Max Width**: Content constrained to `max-w-6xl` with horizontal padding

### **Visual Hierarchy (Top to Bottom)**

1. **Sidebar** (Left, fixed width: 256px on desktop, hidden on mobile)
   - Logo section at top
   - Navigation menu (scrollable)
   - User section at bottom with logout

2. **Header** (Top bar, sticky)
   - Left: Branding ("iSynergies Admin Dashboard")
   - Right: Messages icon with unread badge + username

3. **Main Content Area** (Scrollable)
   - Padding: `px-4 py-6 md:px-8 md:py-8`
   - Cards with rounded corners (`rounded-xl`)
   - Consistent spacing: `space-y-6`

---

## Page-by-Page Breakdown

### 1. **Dashboard (Overview)** - `/admin/dashboard`

**Visual Hierarchy:**
```
┌─────────────────────────────────────┐
│ Page Header                          │
│ - Title: "Overview" (2xl, semibold)  │
│ - Subtitle: "High-level view..."     │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Stats Grid (4 columns on desktop)    │
│ ┌────┐ ┌────┐ ┌────┐ ┌────┐         │
│ │Card│ │Card│ │Card│ │Card│         │
│ │Icon│ │Icon│ │Icon│ │Icon│         │
│ │#   │ │#   │ │#   │ │#   │         │
│ └────┘ └────┘ └────┘ └────┘         │
│ Board | Projects | Team | Services   │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Quick Actions Card                  │
│ - Title + Description               │
│ - Grid of action cards (2 columns)  │
│   Each: Icon + Title + Description  │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Info Card (Gradient background)     │
│ - Icon + Title + Description text  │
└─────────────────────────────────────┘
```

**Key Elements:**
- **Stat Cards**: Hover effects (lift + shadow), clickable links
- **Quick Actions**: Border hover states, icon badges
- **Info Card**: Gradient background (blue-50 to indigo-50)

---

### 2. **Hero Section** - `/admin/dashboard/hero`

**Visual Hierarchy:**
```
┌─────────────────────────────────────┐
│ Page Header                          │
│ - Title: "Hero section management"  │
│ - Subtitle                           │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Hero Visuals Card                    │
│ ┌─────────────────────────────────┐ │
│ │ Header: Title + Save Button    │ │
│ │   - Unsaved changes indicator   │ │
│ │   - "Saved [time]" indicator    │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ Mode Selector (2 cards)          │ │
│ │ ┌──────────┐ ┌──────────┐      │ │
│ │ │Default   │ │Hero      │      │ │
│ │ │(selected)│ │Images    │      │ │
│ │ └──────────┘ └──────────┘      │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ Conditional Content:            │ │
│ │ - Default: Background Media     │ │
│ │ - Hero Images: Logos + Images    │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Announcement Text Bar Card          │
│ ┌─────────────────────────────────┐ │
│ │ Header: Title + "Add Text" btn  │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ Grid of Text Cards (3 columns)   │ │
│ │ Each: Order badge + Text + Actions│
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**Key Elements:**
- **Mode Selector**: Radio-style cards with visual selection state
- **Save State**: Amber "Unsaved changes" or green "Saved" indicator
- **Image Uploads**: Preview thumbnails with remove buttons
- **Text Cards**: Display order badges, edit/delete actions

---

### 3. **About Us** - `/admin/dashboard/about-us`

**Visual Hierarchy:**
```
┌─────────────────────────────────────┐
│ Page Header                          │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Content Card                         │
│ - Title field                        │
│ - 5 Paragraph textareas              │
│ - Mission/Vision sections            │
│ - Save button                        │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Gallery Images Card                  │
│ ┌─────────────────────────────────┐ │
│ │ Header: Title + "Add Image" btn  │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ Grid of Image Cards (3 columns) │ │
│ │ Each: Preview + Alt + Order +    │ │
│ │       Edit/Delete buttons        │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**Key Elements:**
- **Form Fields**: Textareas with HTML tips component
- **Gallery Grid**: Image previews with aspect ratios
- **Dialog**: Add/Edit dialog with image upload

---

### 4. **Services** - `/admin/dashboard/services`

**Visual Hierarchy:**
```
┌─────────────────────────────────────┐
│ Page Header                          │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Statistics Card                      │
│ ┌─────────────────────────────────┐ │
│ │ Header: Title + "Add Stat" btn  │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ Grid of Stat Cards (3 columns)  │ │
│ │ Each: Label + Value + Order     │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Ticker Items Card                    │
│ ┌─────────────────────────────────┐ │
│ │ Header: Title + "Add Item" btn  │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ Grid of Text Cards (3 columns)  │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Services Card                        │
│ ┌─────────────────────────────────┐ │
│ │ Header: Title + "Add Service"   │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ Grid of Service Cards          │ │
│ │ Each: Icon preview + Title +   │ │
│ │       Description + Order       │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**Key Elements:**
- **Three Sections**: Statistics, Ticker Items, Services
- **Icon Previews**: Service cards show uploaded icon images
- **Order Management**: Display order with validation

---

### 5. **Messages** - `/admin/dashboard/messages`

**Visual Hierarchy:**
```
┌─────────────────────────────────────┐
│ Page Header                          │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Filter Tabs                          │
│ [All] [New] [Read] [Replied] [Archived]│
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Messages List (Left Side)            │
│ ┌─────────────────────────────────┐ │
│ │ Message Card (New - Blue badge) │ │
│ │ - Avatar + Name + Email         │ │
│ │ - Status badge + Timestamp      │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ Message Card (Read - Gray)      │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Message Detail (Right Side)         │
│ ┌─────────────────────────────────┐ │
│ │ Header: Name + Status actions   │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ Contact Info                    │ │
│ │ - Email, Phone, Project link    │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ Message Content                 │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ Admin Notes (Textarea)          │ │
│ │ - Save Notes button             │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**Key Elements:**
- **Status Badges**: Color-coded (blue=new, gray=read, green=replied, purple=archived)
- **Two-Column Layout**: List on left, detail on right
- **Auto-refresh**: Updates every 5 seconds
- **Avatar Initials**: Generated from name

---

### 6. **Projects** - `/admin/dashboard/projects`

**Visual Hierarchy:**
```
┌─────────────────────────────────────┐
│ Page Header                          │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Filter Tabs                          │
│ [All] [Desktop] [Mobile] [Tools]     │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Projects Grid (3 columns)           │
│ ┌─────────────────────────────────┐ │
│ │ Project Card                     │ │
│ │ - Thumbnail preview             │ │
│ │ - Title + Year + Category badge  │ │
│ │ - Order badge                    │ │
│ │ - Edit/Delete buttons            │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Add/Edit Dialog                      │
│ - Form fields (title, year, etc.)   │
│ - Thumbnail + 4 screenshot uploads  │
│ - Category select                   │
│ - Display order                     │
└─────────────────────────────────────┘
```

**Key Elements:**
- **Category Filtering**: Tabs to filter by project type
- **Thumbnail Previews**: Large image previews in cards
- **Multiple Screenshots**: 4 screenshot upload fields
- **Category Badges**: Visual indicators for desktop/mobile/tools

---

### 7. **Board of Directors** - `/admin/dashboard/board-members`

**Visual Hierarchy:**
```
┌─────────────────────────────────────┐
│ Page Header                          │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Board Members Card                   │
│ ┌─────────────────────────────────┐ │
│ │ Header: Title + "Add Member"    │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ Grid of Member Cards (3 cols)   │ │
│ │ Each:                            │ │
│ │ - Photo preview                 │ │
│ │ - Name + Position               │ │
│ │ - Order badge                   │ │
│ │ - Edit/Delete buttons           │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Footer Text Card                     │
│ - Textarea for footer content        │
│ - Save button                        │
└─────────────────────────────────────┘
```

**Key Elements:**
- **Member Cards**: Photo previews with rounded corners
- **Footer Section**: Separate card for board section footer text
- **Order Management**: Display order badges

---

### 8. **Team Members** - `/admin/dashboard/team`

**Visual Hierarchy:**
```
┌─────────────────────────────────────┐
│ Page Header                          │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Team Members Card                    │
│ ┌─────────────────────────────────┐ │
│ │ Header: Title + "Add Member"    │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ Grid of Member Cards (3 cols)   │ │
│ │ Each:                            │ │
│ │ - Photo preview (or placeholder) │ │
│ │ - Name + Position               │ │
│ │ - Order badge                   │ │
│ │ - Edit/Delete buttons           │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**Key Elements:**
- **Similar to Board Members**: Same card structure
- **Placeholder Icons**: User icon when no photo
- **Simpler**: No footer section

---

### 9. **Shop** - `/admin/dashboard/shop`

**Visual Hierarchy:**
```
┌─────────────────────────────────────┐
│ Page Header                          │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Shop Content Card                    │
│ - Title + Description fields         │
│ - Sales Icon upload                  │
│ - Authorized Dealer Image upload     │
│ - Save button                        │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Categories Card                      │
│ ┌─────────────────────────────────┐ │
│ │ Header: Title + "Add Category"  │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ Grid of Category Cards (3 cols) │ │
│ │ Each: Image + Name + Text +     │ │
│ │       Order + Actions           │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Authorized Dealers Card              │
│ ┌─────────────────────────────────┐ │
│ │ Header: Title + "Add Dealer"    │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ Grid of Dealer Cards (3 cols)   │ │
│ │ Each: Image + Name + Order +   │ │
│ │       Actions                   │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**Key Elements:**
- **Three Sections**: Content, Categories, Dealers
- **Image Previews**: Category and dealer images
- **Content Management**: Title, description, icon uploads

---

### 10. **Site Settings** - `/admin/dashboard/site-settings`

**Visual Hierarchy:**
```
┌─────────────────────────────────────┐
│ Page Header                          │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Site Settings Card                   │
│ ┌─────────────────────────────────┐ │
│ │ Company Information             │ │
│ │ - Name, Address, Phone, Email   │ │
│ │ - Contact Forward Email         │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ Social Media Links               │ │
│ │ - Facebook, Twitter, Instagram  │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ Logo Upload                     │ │
│ │ - Image upload with preview     │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ Save Button                     │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**Key Elements:**
- **Form Layout**: Grouped sections (Company Info, Social Media, Logo)
- **Input Fields**: Text inputs and textarea
- **Logo Preview**: Image upload with preview

---

### 11. **What We Do** - `/admin/dashboard/what-we-do`

**Visual Hierarchy:**
```
┌─────────────────────────────────────┐
│ Page Header                          │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Content Card                         │
│ - Title + Description fields         │
│ - Image uploads (multiple)           │
│ - Save button                        │
└─────────────────────────────────────┘
```

**Key Elements:**
- **Content Management**: Text and image fields
- **Image Gallery**: Multiple image uploads

---

### 12. **Featured App** - `/admin/dashboard/featured-app`

**Visual Hierarchy:**
```
┌─────────────────────────────────────┐
│ Page Header                          │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Featured App Content Card            │
│ - Title, Description fields         │
│ - Carousel images management         │
│ - Features management                │
│ - Save button                        │
└─────────────────────────────────────┘
```

**Key Elements:**
- **Carousel Management**: Multiple carousel images
- **Features List**: Add/edit/delete features
- **Complex Structure**: Nested content management

---

## Common Design Patterns

### **Card Structure**
- **Border**: `border border-border`
- **Background**: `bg-white` with `shadow-sm`
- **Rounded**: `rounded-xl`
- **Padding**: `p-6`
- **Header**: Border-bottom separator, title + action button

### **Color Scheme**
- **Primary Text**: `text-gray-800` or `text-foreground`
- **Muted Text**: `text-muted-foreground` or `text-gray-800` with opacity
- **Borders**: `border-border` (gray)
- **Accents**: Blue (`bg-blue-500`, `text-blue-600`)
- **Status Colors**: 
  - Success: Green
  - Error: Red
  - Warning: Amber
  - Info: Blue

### **Typography Hierarchy**
1. **Page Title**: `text-2xl font-semibold`
2. **Card Title**: `text-lg font-medium`
3. **Section Title**: `text-base font-medium`
4. **Body Text**: `text-sm`
5. **Helper Text**: `text-xs text-muted-foreground`

### **Interactive Elements**
- **Buttons**: Rounded, with hover states
- **Cards**: Hover lift effect (`hover:-translate-y-0.5`)
- **Links**: Underline on hover
- **Forms**: Focus states with ring

### **Spacing System**
- **Page Level**: `space-y-6` or `space-y-8`
- **Card Content**: `p-6`
- **Form Fields**: `space-y-2` or `space-y-4`
- **Grid Gaps**: `gap-4`, `gap-6`

### **Responsive Behavior**
- **Mobile**: Single column, sidebar hidden
- **Tablet**: 2-column grids (`md:grid-cols-2`)
- **Desktop**: 3-4 column grids (`lg:grid-cols-3`, `lg:grid-cols-4`)

---

## Navigation Structure

**Sidebar Navigation Items:**
1. Dashboard (Overview)
2. Hero Section
3. About Us
4. What We Do
5. Board of Directors
6. Services
7. Projects
8. Featured App
9. Team Members
10. Shop
11. Site Settings

**Active State**: Blue background (`bg-primary`), white text
**Inactive State**: Gray text, hover accent background

---

## User Experience Patterns

1. **Loading States**: Full-screen loading component with message
2. **Empty States**: Centered text with helpful message
3. **Error Handling**: Toast notifications (success/error)
4. **Confirmation Dialogs**: For destructive actions (delete)
5. **Form Validation**: Inline error messages
6. **Auto-save Indicators**: "Unsaved changes" / "Saved [time]"
7. **Image Previews**: Thumbnails with remove buttons
8. **Order Management**: Display order badges, auto-increment

---

## Accessibility Features

- **ARIA Labels**: On icon buttons
- **Keyboard Navigation**: Focus states visible
- **Screen Reader Support**: Semantic HTML
- **Color Contrast**: WCAG compliant text colors
- **Focus Management**: Proper tab order
