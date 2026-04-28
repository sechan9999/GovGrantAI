# GovAI - US Federal Grant Proposal Generator

![GovAI Hero Banner](https://us-grant-ai.vercel.app/favicon.svg) <!-- Using standard Vite icon as placeholder -->

**GovAI** is a modernized, premium web application designed to help organizations instantly generate well-structured US federal grant proposals. By taking core project details as input, the app synthesizes comprehensive, standard-aligned grant plans (e.g., for NSF, NIH, DOE).

🌐 **Live Demo:** [us-grant-ai.vercel.app](https://us-grant-ai.vercel.app/)

## ✨ Key Features

- **US Agency Formats:** Generates structures tailored for major federal agencies including NSF, NIH, DOE, and ED.
- **Premium Aesthetics (UI/UX):** Features a sleek dark-mode interface with smooth glassmorphism (glass-card) components, ambient gradient orbs, and engaging micro-animations.
- **Sample Data Injection:** One-click "Fill Sample Data" button to quickly populate the form with a realistic medical/AI grant scenario for testing.
- **Past Performance Tracking:** Dedicated section for "Organizational Background & Track Record" to prove institutional capability.
- **AI Simulation:** Engages users with a progressive loading state, simulating the AI generation of executive summaries, budget narratives, and evaluation plans.
- **Export to Markdown:** Instantly download the synthesized proposal as a `.md` file for seamless integration into Obsidian, Notion, or GitHub.
- **Export to PDF:** Generates high-quality, print-ready PDF documents directly from the browser using `html2pdf.js`.

## 🛠️ Technology Stack

- **Framework:** [Vite](https://vitejs.dev/) (Vanilla JS Template)
- **Structure:** Semantic HTML5
- **Styling:** Vanilla CSS (CSS Variables, Flexbox/Grid, Animations)
- **Libraries:** `html2pdf.js` for client-side PDF generation
- **Deployment:** Vercel (CI/CD Integrated)

## 🚀 Getting Started

To run this project locally:

### 1. Clone the repository
```bash
git clone https://github.com/sechan9999/GovGrantAI.git
cd GovGrantAI
```

### 2. Install dependencies
```bash
npm install
```

### 3. Start the development server
```bash
npm run dev
```
The app will be available at `http://localhost:5173`.

### 4. Build for production
```bash
npm run build
```

## 📂 Project Structure

- `index.html`: The main entry point containing the semantic DOM structure and layout.
- `style.css`: All application styling, including the dark theme, glassmorphism utilities, responsive grids, and CSS keyframe animations.
- `main.js`: Client-side logic for handling DOM events, the simulated AI loading sequence, generating the output HTML, and managing the PDF/Markdown exports.

## 🤝 Contributing
Contributions, issues, and feature requests are welcome!

## 📝 License
This project is [MIT](https://choosealicense.com/licenses/mit/) licensed.
