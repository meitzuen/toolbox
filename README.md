# DevToolBox

DevTools is a comprehensive suite of essential utilities designed to streamline common tasks for software developers. Built with a modern tech stack, it provides a fast and responsive interface for everyday development needs.

## 🚀 Key Features

### JWT
- **JWT Decoder:** Decode and inspect JSON Web Tokens locally, with signature verification.
- **JWT Encoder:** Create HS256/HS384/HS512 signed tokens, with `iat`/`exp` helpers.

### JSON
- **JSON Formatter:** Quickly format and prettify JSON data.
- **JSON Extractor:** Pull one or more fields out of a JSON array.
- **JSON Diff:** Compare two JSON objects and highlight differences.
- **JSON Converter:** Convert between JSON and YAML / CSV.
- **JSON → Types / Schema:** Generate TypeScript interfaces / types or a JSON Schema from a payload.

### Generators
- **UUID Generator:** Generate unique identifiers (v4) with ease.
- **Timestamp Converter:** Convert between Unix timestamps and human-readable dates.
- **Date Calculator:** Time zone conversion, date differences, and add/subtract.
- **Cron Parser:** Explain a cron expression and preview upcoming runs.
- **Test Players:** Generate fake player records (RPG / FPS / sports) as JSON or CSV.
- **Mock Data / Lorem:** Build custom records (JSON / CSV / SQL INSERT) or lorem ipsum text.
- **QR Code:** Generate QR codes and decode them from images.
- **Password Generator:** Create secure, customizable passwords.
- **Hash / HMAC:** SHA-1/256/384/512 digests and HMAC for text or files.

### Postman Tools
- **Postman Beautifier:** Prettify JSON request bodies and format Pre-request/Test scripts in a collection.
- **Postman Editor:** Edit and renumber test case names (FN, FET, BT prefixes) across a collection.
- **Postman Parser:** Extract matching requests and scripts from a collection into individual files, downloaded as a ZIP archive.
- **Postman Collection Diff:** Compare two collections request by request.
- **cURL Converter:** Turn a cURL command into a Postman collection, `fetch` or `axios` code.

### Lists & Text
- **List Comparator:** Compare two lists to find differences and commonalities.
- **Find Duplicates:** Identify and manage duplicate entries in lists.
- **List Prettifier:** Quote, wrap and join lists (e.g. SQL `IN (...)`).
- **URL Combinator:** Generate all URL combinations from base paths and parameter lists.
- **Regex Validator:** Test and debug regular expressions in real-time.
- **Text Diff:** Line diff with inline word highlighting.
- **Text Stats & Cleanup:** Counts plus sort / dedupe / trim / case operations with undo.
- **HTML/XML/CSS/SQL Formatter:** Beautify or minify markup, styles and SQL.
- **Markdown Preview:** Live, sanitized Markdown rendering with HTML export.

### Encoding
- **Base64:** Encode and decode Base64 strings.
- **URL Encoder / Decoder:** Percent-encode and decode strings or whole URLs.
- **URL Parser:** Break a URL into parts and edit its query parameters.
- **Entity / Unicode Escape:** HTML entities, `\uXXXX` and `\u{X}` escapes.
- **Number Base Converter:** Convert numbers between binary, octal, decimal, and hex.
- **Case Converter:** Transform text between camelCase, snake_case, PascalCase, and more.
- **Color Converter:** HEX / RGB / HSL conversion with WCAG contrast checks.
- **Chmod Calculator:** Convert between permission checkboxes, octal and symbolic notation.

### Images
- **Test Image Generator:** Create placeholder images for testing.
- **Image ⇄ Base64:** Convert images to data URIs / snippets and back.

## 🛠️ Tech Stack

- **Framework:** [React 19](https://react.dev/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Bundler:** [Vite](https://vitejs.dev/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Utilities:** [js-beautify](https://github.com/beautifier/js-beautify), [JSZip](https://stuk.github.io/jszip/), yaml, sql-formatter, qrcode, jsQR, marked, DOMPurify
- **Deployment:** [Firebase Hosting](https://firebase.google.com/docs/hosting)

## 🏁 Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed on your machine.

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd toolbox
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

### Running Locally

To start the development server and preview the app:
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

## 📦 Building and Deployment

### Build for Production
To create an optimized production build:
```bash
npm run build
```

### Deploy to Firebase
1. **Login to Firebase (one-time setup):**
   ```bash
   npx firebase login
   ```
2. **Deploy the application:**
   ```bash
   npx firebase deploy
   ```

## 🤝 Contributing
Contributions are welcome! Feel free to open an issue or submit a pull request if you have ideas for new tools or improvements.
