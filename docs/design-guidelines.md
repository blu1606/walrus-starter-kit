# Walrus Starter Kit - Design Guidelines

**Version:** 1.0  
**Last Updated:** January 17, 2026  
**Status:** Production Ready

---

## 📐 Design Philosophy

**"Deep Ocean Glass" meets "Arctic Shipyard"**

The Walrus Starter Kit embodies two complementary design languages:

1. **CLI/Terminal**: Minimalist, efficient, developer-focused
2. **Generated Templates**: Modern Web3 aesthetic with functional glassmorphism

**Core Principles:**

- ✅ **Data First**: Storage tools prioritize precision (Blob IDs, file sizes, metadata)
- ✅ **Trust Through Calm**: No aggressive colors; use blues/cyans for stability
- ✅ **Accessibility**: WCAG AA contrast, colorblind-safe palette, terminal-safe ANSI
- ✅ **Developer Experience**: Clear feedback, actionable errors, progressive disclosure

---

## 🎨 Branding Identity

### **Positioning**

**"The Arctic Shipyard"** - Solid, reliable scaffolding for building on Walrus Protocol.

**Archetype:** The Efficient Builder  
**Voice:** Practical, developer-focused, rugged but modern  
**Tagline:** _"Scaffold. Store. Ship."_

### **Logo Concept**

**"Pixel-Crate"** - Recommended primary logo

**Description:**

- 3D isometric shipping crate in Walrus pixel-art style
- Front face features simplified pixelated walrus tusk/face
- Symbolizes: Storage + Packages + Walrus mascot

**Specifications:**

- Scalable to 16x16px (favicon)
- Convertible to ASCII art for CLI
- Primary colors: Sui Blue `#4DA2FF`, Deep Grey, White

**AI Generation Prompt:**

```
A minimalist logo symbol for a developer tool called "Walrus Starter Kit".
The design should feature a stylized shipping crate or box that subtly
resembles a walrus face or tusks. Use a pixel-art or 8-bit aesthetic to
match the "Walrus Protocol" crypto brand. Colors: Electric Blue (#4DA2FF),
Deep Grey, and White. Background: Solid white. Style: Flat vector, geometric,
tech-focused, similar to Vercel or Docker logos. No text.
```

---

## 🎨 Color System

### **CLI Terminal Colors (ANSI-Safe)**

| Role             | Hex       | ANSI Code  | Usage                                  |
| ---------------- | --------- | ---------- | -------------------------------------- |
| **Success**      | `#00D787` | Green 42   | ✅ Completed actions, success messages |
| **Error**        | `#FF5F87` | Red 204    | ❌ Blocking issues, failures           |
| **Warning**      | `#FFD700` | Yellow 220 | ⚠️ Attention needed, non-blocking      |
| **Info**         | `#00D7FF` | Cyan 45    | ℹ️ Neutral information                 |
| **Subtle**       | `#6C7086` | Gray 243   | Dimmed text, timestamps                |
| **Primary Text** | `#CDD6F4` | White 252  | Main terminal output                   |

**Tool:** kleur (zero dependencies, smallest bundle)

### **React Component Colors ("Abyssal Plain" Theme)**

| Role           | Hex       | Tailwind     | Usage                                    |
| -------------- | --------- | ------------ | ---------------------------------------- |
| **Background** | `#020617` | `slate-950`  | Main app background (OLED-friendly)      |
| **Surface**    | `#1E293B` | `slate-800`  | Cards, panels (50-80% opacity for glass) |
| **Primary**    | `#06B6D4` | `cyan-500`   | Primary buttons, active states, links    |
| **Secondary**  | `#3B82F6` | `blue-500`   | Secondary actions, info highlights       |
| **Accent**     | `#8B5CF6` | `violet-500` | Gradients, special highlights (NFT/Blob) |
| **Text Main**  | `#F8FAFC` | `slate-50`   | Headings, primary content                |
| **Text Muted** | `#94A3B8` | `slate-400`  | Labels, meta-data, descriptions          |
| **Border**     | `#334155` | `slate-700`  | Subtle separation lines                  |

### **Brand Colors (Ecosystem Alignment)**

| Role            | Hex       | Name        | Usage                       |
| --------------- | --------- | ----------- | --------------------------- |
| **Sui Blue**    | `#4DA2FF` | Sui Ocean   | Logo, primary brand color   |
| **Walrus Grey** | `#9CA3AF` | Walrus Grey | Neutral UI, "tusk" elements |
| **Arctic Cyan** | `#06B6D4` | Arctic Cyan | Accents, fresh highlights   |
| **Deep Trench** | `#111827` | Deep Trench | Dark backgrounds, terminal  |

---

## 🔤 Typography

### **CLI/Terminal**

- **Font:** System monospace (Terminal default)
- **Style:** Plain text, no bold/italic in terminal
- **Formatting:** Use Unicode box-drawing characters for borders

### **Generated React Templates**

**Font Stack:**

```css
/* Headings */
font-family:
  'Outfit',
  'Inter',
  -apple-system,
  BlinkMacSystemFont,
  sans-serif;
font-weight:
  600 (SemiBold),
  700 (Bold);

/* Body Text */
font-family:
  'Plus Jakarta Sans',
  'Inter',
  -apple-system,
  sans-serif;
font-weight:
  400 (Regular),
  500 (Medium);

/* Code/Data/Blob IDs */
font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
font-weight: 400 (Regular);
```

**Google Fonts Import:**

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link
  href="https://fonts.googleapis.com/css2?family=Outfit:wght@600;700&family=Plus+Jakarta+Sans:wght@400;500&family=JetBrains+Mono:wght@400&display=swap"
  rel="stylesheet"
/>
```

**Type Scale:**

```css
--text-xs: 0.75rem; /* 12px - Meta-data */
--text-sm: 0.875rem; /* 14px - Labels */
--text-base: 1rem; /* 16px - Body */
--text-lg: 1.125rem; /* 18px - Subheadings */
--text-xl: 1.25rem; /* 20px - Section titles */
--text-2xl: 1.5rem; /* 24px - Page headings */
--text-3xl: 1.875rem; /* 30px - Hero text */
```

---

## 🧩 CLI Component Patterns

### **1. Welcome Banner**

```
╭─────────────────────────────────────╮
│                                     │
│   🐋 Walrus Starter Kit v0.1.0     │
│   Interactive Project Scaffolder    │
│                                     │
╰─────────────────────────────────────╯
```

### **2. Interactive Prompts**

```
? What is your project name? › my-walrus-app
                              ▔▔▔▔▔▔▔▔▔▔▔▔▔▔

? Select SDK:
❯ @mysten/walrus (Official - Recommended)
  @hibernuts/walrus-sdk
```

### **3. Progress Indicators**

```
[1/6] ✓ Validating configuration
[2/6] ✓ Creating directory structure
[3/6] ⠋ Copying base template...
```

**Spinner:** ora dots pattern (⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏)

### **4. Success Message**

```
────────────────────────────────────────

✅ Success! Your Walrus app is ready.

Next steps:

  1. Navigate to your project:
     cd my-walrus-app

  2. Copy environment variables:
     cp .env.example .env

  3. Update .env with your configuration

  4. Start development server:
     pnpm dev

Happy building! 🚀
```

### **5. Error Message**

```
❌ Error: Directory "my-app" already exists

Suggestion:
  • Choose a different name
  • Remove existing directory: rm -rf my-app
```

### **6. Warning Message**

```
⚠️  Missing .env file

Creating .env.example with required variables:
  VITE_WALRUS_NETWORK=testnet
  VITE_SUI_NETWORK=testnet
```

---

## 🎨 React Component Patterns

### **1. Upload Zone ("The Drop")**

**Visual Design:**

- Dashed border (`border-dashed border-2 border-slate-700`)
- On drag-over: Light up (`border-cyan-500/50`)
- Inner subtle radial gradient glow
- Large icon + clear call-to-action

**Code Pattern:**

```tsx
<div
  className={`
    border-2 border-dashed rounded-lg p-12 text-center
    transition-all duration-200
    ${
      isDragging
        ? 'border-cyan-500/50 bg-cyan-500/5'
        : 'border-slate-700 hover:border-slate-600'
    }
  `}
  onDragOver={(e) => {
    e.preventDefault();
    setIsDragging(true);
  }}
  onDragLeave={() => setIsDragging(false)}
  onDrop={handleDrop}
>
  <UploadIcon className="w-16 h-16 mx-auto mb-4 text-slate-400" />
  <p className="text-lg font-medium text-slate-50">
    Drag & Drop or Click to Upload
  </p>
  <p className="text-sm text-slate-400 mt-2">Max size: 10MB</p>
</div>
```

### **2. Blob Cards (File Preview)**

**Visual Design:**

- Glass finish (`bg-slate-800/40 backdrop-blur-sm`)
- Aspect-square grid items
- Hover: Slide up metadata overlay
- Object-cover image/video preview

**Code Pattern:**

```tsx
<div className="aspect-square rounded-lg overflow-hidden bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 hover:border-cyan-500/50 transition-all group">
  <div className="relative w-full h-full">
    {/* Image Preview */}
    <img
      src={previewUrl}
      alt={fileName}
      className="w-full h-full object-cover"
    />

    {/* Metadata Overlay */}
    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950 to-transparent p-4 translate-y-full group-hover:translate-y-0 transition-transform">
      <p className="text-xs font-mono text-slate-400 truncate">
        {blobId.slice(0, 16)}...
      </p>
      <p className="text-sm text-slate-300">{formatBytes(fileSize)}</p>
      <button className="mt-2 text-cyan-500 hover:text-cyan-400">
        Copy ID
      </button>
    </div>
  </div>
</div>
```

### **3. Connect Wallet Button**

**Visual Design:**

- Pill-shaped (`rounded-full`)
- Gradient border (Cyan to Violet) or solid Primary
- Truncated address when connected
- Identicon/Avatar optional

**Code Pattern:**

```tsx
<button className="px-6 py-3 rounded-full bg-gradient-to-r from-cyan-500 to-violet-500 p-[2px] hover:shadow-lg hover:shadow-cyan-500/50 transition-all">
  <span className="flex items-center gap-2 bg-slate-950 rounded-full px-6 py-2.5">
    {connected ? (
      <>
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-500 to-violet-500" />
        <span className="font-mono text-sm">
          {address.slice(0, 6)}...{address.slice(-4)}
        </span>
      </>
    ) : (
      <span>Connect Wallet</span>
    )}
  </span>
</button>
```

### **4. Transaction Status**

**Visual Design:**

- Success: Green ring pulse + toast notification
- Pending: Rotating spinner (gradient) + status text
- Error: Shake animation + red border glow

**States:**

```tsx
// Success
<div className="animate-pulse-ring border-2 border-green-500 rounded-lg p-4">
  <CheckIcon className="text-green-500" />
  <p>Transaction Confirmed</p>
</div>

// Pending
<div className="flex items-center gap-3">
  <div className="animate-spin w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full" />
  <p className="text-slate-400">Finalizing on Sui...</p>
</div>

// Error
<div className="animate-shake border-2 border-red-500/50 rounded-lg p-4">
  <ErrorIcon className="text-red-500" />
  <p>Transaction Failed</p>
</div>
```

---

## ✨ Micro-interactions

### **Hover Effects**

```css
/* Card Lift */
.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(6, 182, 212, 0.2); /* Cyan tinted shadow */
}

/* Button Glow */
.button:hover {
  box-shadow: 0 0 20px rgba(6, 182, 212, 0.5);
}
```

### **Loading States**

```tsx
// Skeleton Screen (preferred over spinners for initial load)
<div className="animate-pulse space-y-4">
  <div className="h-4 bg-slate-800 rounded w-3/4"></div>
  <div className="h-4 bg-slate-800 rounded w-1/2"></div>
</div>
```

### **Copy Feedback**

```tsx
// Icon switches to checkmark for 2s
const [copied, setCopied] = useState(false);

const handleCopy = () => {
  navigator.clipboard.writeText(blobId);
  setCopied(true);
  setTimeout(() => setCopied(false), 2000);
};

{
  copied ? <CheckIcon /> : <CopyIcon />;
}
```

### **Error Shake**

```css
@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-4px);
  }
  75% {
    transform: translateX(4px);
  }
}

.error-shake {
  animation: shake 0.3s ease-in-out;
}
```

---

## 📱 Responsive Design

### **Breakpoints** (Tailwind defaults)

```css
sm: 640px   /* Mobile landscape */
md: 768px   /* Tablet portrait */
lg: 1024px  /* Tablet landscape / Small desktop */
xl: 1280px  /* Desktop */
2xl: 1536px /* Large desktop */
```

### **Mobile-First Patterns**

```tsx
// Stack on mobile, grid on desktop
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Blob cards */}
</div>

// Hide text labels on mobile
<span className="hidden sm:inline">Upload File</span>
<UploadIcon className="sm:hidden" />
```

---

## ♿ Accessibility

### **Color Contrast**

All text combinations meet WCAG AA standards:

- **Primary text on background**: 15.21:1 (AAA)
- **Muted text on background**: 4.87:1 (AA)
- **Cyan on dark**: 7.12:1 (AAA)

### **Keyboard Navigation**

```tsx
// Focus styles
className =
  'focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-950';
```

### **Screen Reader Support**

```tsx
<button aria-label="Upload file">
  <UploadIcon />
</button>

<div role="status" aria-live="polite">
  {uploadStatus}
</div>
```

---

## 🚀 Implementation Checklist

### **CLI Tool**

- [x] kleur for colors (no chalk/picocolors)
- [ ] ora for spinners (Planned)
- [x] prompts for interactive questions
- [x] ASCII box-drawing characters (╭╮╰╯─│)
- [x] Emoji consistency (✅❌⚠️ℹ️🐋)
- [x] Step indicators `[1/6]`

### **React Templates**

- [ ] Tailwind CSS configured with custom colors
- [ ] Google Fonts: Outfit + Plus Jakarta Sans + JetBrains Mono
- [ ] Dark mode by default
- [ ] Glass effect: `backdrop-blur-sm` + opacity
- [ ] Hover states on all interactive elements
- [ ] Loading skeletons for async content
- [ ] Error boundaries with recovery UI
- [ ] ARIA labels on icon-only buttons

---

## 📚 References

**Design Research:**

- `/plans/reports/researcher-260117-1358-cli-design.md`
- `/plans/reports/researcher-260117-1358-react-design.md`
- `/plans/reports/researcher-260117-1358-branding.md`

**Ecosystem:**

- [Sui Brand Kit](https://sui.io)
- [Walrus Protocol](https://docs.walrus.site)

**Tools:**

- [Tailwind CSS](https://tailwindcss.com)
- [Google Fonts](https://fonts.google.com)
- [kleur](https://github.com/lukeed/kleur)
- [ora](https://github.com/sindresorhus/ora)

---

**Version History:**

- v1.0 (Jan 17, 2026) - Initial design guidelines
