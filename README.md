# CSV to JSON Converter

A lightweight, fast, and responsive web-based application to convert CSV (Comma-Separated Values) data or files into clean JSON format instantly. Built using pure front-end web technologies without any heavy frameworks or server-side dependencies.

---

## ✨ Features

- **File Upload & Direct Input:** Convert by uploading `.csv` files or pasting raw CSV text directly.
- **Instant Conversion:** Fast, real-time client-side processing using Vanilla JavaScript.
- **Copy to Clipboard:** Copy the generated JSON output with a single click.
- **Download JSON:** Save the converted JSON directly as a `.json` file.
- **Responsive UI:** Styled cleanly with Tailwind CSS (CDN) for seamless experience across desktop and mobile devices.
- **Zero Installation Needed:** Runs directly in any modern web browser without needing `npm`, Node.js, or backend servers.

---

## 🛠️ Tech Stack

- **HTML5:** Semantic structure.
- **Tailwind CSS (via CDN):** Utility-first CSS framework for modern styling.
- **Vanilla JavaScript (ES6+):** Core logic for parsing CSV text and manipulating DOM elements.

---

## 🚀 How to Run Locally

Since this project runs entirely on the client side, setting it up is extremely simple:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/your-repo-name.git
   ```

2. **Navigate to the project directory:**
   ```bash
   cd your-repo-name
   ```

3. **Open the application:**
   - Double-click the `index.html` file to open it in your browser.
   - *Alternatively*, open it using a local server tool like Live Server in VS Code.

---

## 📖 Usage Example

### 1. Input (CSV)
```csv
id,name,role,email
1,Alex,Developer,alex@example.com
2,Sarah,Designer,sarah@example.com
```

### 2. Output (JSON)
```json
[
  {
    "id": "1",
    "name": "Alex",
    "role": "Developer",
    "email": "alex@example.com"
  },
  {
    "id": "2",
    "name": "Sarah",
    "role": "Designer",
    "email": "sarah@example.com"
  }
]
```

---

## 📁 Project Structure

```text
├── index.html      # Main HTML layout with Tailwind CDN
├── style.css       # Custom CSS overrides (if applicable)
├── script.js      # CSV parsing logic and event handlers
└── README.md       # Project documentation
```

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).