# DevToolBox

DevTools is a comprehensive suite of essential utilities designed to streamline common tasks for software developers. Built with a modern tech stack, it provides a fast and responsive interface for everyday development needs.

## 🚀 Key Features

### Auth & Security
- **JWT Decoder:** Decode and inspect JSON Web Tokens locally.
- **Password Generator:** Create secure, customizable passwords.
- **Hash Generator:** Generate MD5, SHA-1, SHA-256, and SHA-512 hashes.

### Encoding
- **Base64:** Encode and decode Base64 strings.
- **Number Base Converter:** Convert numbers between binary, octal, decimal, and hex.
- **Case Converter:** Transform text between camelCase, snake_case, PascalCase, and more.

### Postman Tools
- **Postman Beautifier:** Prettify JSON request bodies and format Pre-request/Test scripts in a collection.
- **Postman Resequencer:** Automatically renumber test case names (FN, FET, BT prefixes) across a collection.
- **Postman Parser:** Extract matching requests and scripts from a collection into individual files, downloaded as a ZIP archive.
- **URL Combinator:** Generate all URL combinations from base paths and parameter lists.

### JSON
- **JSON Formatter:** Quickly format and prettify JSON data.
- **JSON Field Extractor:** Pull specific fields out of a JSON array.
- **JSON Diff:** Compare two JSON objects and highlight differences.

### Lists & Text
- **List Comparator:** Compare two lists to find differences and commonalities.
- **Find Duplicates:** Identify and manage duplicate entries in lists.
- **Regex Validator:** Test and debug regular expressions in real-time.

### Generators
- **UUID Generator:** Generate unique identifiers (v4) with ease.
- **Timestamp Converter:** Convert between Unix timestamps and human-readable dates.

## 🛠️ Tech Stack

- **Framework:** [React 19](https://react.dev/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Bundler:** [Vite](https://vitejs.dev/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Utilities:** [js-beautify](https://github.com/beautifier/js-beautify), [JSZip](https://stuk.github.io/jszip/)
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
