# 🚀 ReviewLens

> **AI-powered product review analysis platform built with React, Express, and Google Gemini AI.**

ReviewLens transforms raw customer reviews into actionable insights in seconds. Simply paste a product URL or a block of customer reviews, and ReviewLens generates an AI-powered report including sentiment analysis, key themes, strengths, weaknesses, and an overall buying recommendation.

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react" />
  <img src="https://img.shields.io/badge/Vite-6-646CFF?style=for-the-badge&logo=vite" />
  <img src="https://img.shields.io/badge/Express.js-5-000000?style=for-the-badge&logo=express" />
  <img src="https://img.shields.io/badge/TailwindCSS-3-38BDF8?style=for-the-badge&logo=tailwindcss" />
  <img src="https://img.shields.io/badge/Google-Gemini_AI-4285F4?style=for-the-badge&logo=google" />
  <img src="https://img.shields.io/badge/Vercel-Deployed-black?style=for-the-badge&logo=vercel" />
</p>

---

## 🌐 Live Demo

**Application:** https://review-lens-six.vercel.app/

---

## ✨ Features

- 🤖 AI-powered review analysis using Google Gemini
- 📄 Three-sentence TL;DR summary
- 😊 Sentiment breakdown (Positive / Neutral / Negative)
- ⭐ Top praised product features
- ⚠️ Most common customer complaints
- 📊 Overall Buy Verdict (1–10)
- 🏷️ Key discussion themes
- 📋 Copy report to clipboard
- 🔗 Shareable report links
- 🌍 Automatic language detection
- 🚫 Spam & duplicate review handling
- 📱 Fully responsive modern UI
- ⚡ Fast serverless API deployment

---

# 📸 Screenshots

> Replace these with actual screenshots after deployment.

| Home | Analysis Dashboard |
|------|--------------------|
| ![](screenshots/home.png) | ![](screenshots/dashboard.png) |

---

# 🏗️ Architecture

```
                User Input
                     │
     ┌───────────────┴───────────────┐
     │                               │
 Product URL                 Customer Reviews
     │                               │
     └───────────────┬───────────────┘
                     │
             Data Processing
                     │
      Language Detection & Cleanup
                     │
            Google Gemini AI
                     │
          Structured JSON Response
                     │
        Interactive Results Dashboard
```

---

# 🛠️ Tech Stack

## Frontend

- React 19
- Vite
- Tailwind CSS
- JavaScript (ES Modules)
- Lucide React

## Backend

- Node.js
- Express.js
- Google Gemini API
- REST API

## Database

- SQL.js (SQLite in development)

## Deployment

- Vercel (Frontend + Serverless API)

---

# 📊 AI Analysis Includes

Every analysis contains:

- Three-line summary
- Sentiment percentages
- Key discussion themes
- Top 3 praised features
- Top 3 customer complaints
- Buy score (1–10)
- One-line buying recommendation

---

# 🚀 Getting Started

## 1. Clone the repository

```bash
git clone https://github.com/yourusername/ReviewLens.git
```

```bash
cd ReviewLens
```

---

## 2. Install dependencies

```bash
npm install
```

---

## 3. Create environment variables

Create a `.env.local` file:

```env
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
CLIENT_ORIGIN=http://localhost:5173
```

> Get your API key from **Google AI Studio**.

---

## 4. Run the development server

```bash
npm run dev
```

The application will be available at:

Frontend

```
http://localhost:5173
```

Backend

```
http://localhost:3001
```

---

# 📂 Project Structure

```
ReviewLens
│
├── api/                # Serverless API entry
├── public/
├── server/
│   ├── analyzer.js
│   ├── app.js
│   ├── db.js
│   ├── prompt.js
│   ├── source.js
│   └── index.js
│
├── src/
│   ├── components/
│   ├── pages/
│   ├── hooks/
│   └── assets/
│
├── package.json
└── vercel.json
```

---

# 🔐 Environment Variables

| Variable | Description |
|----------|-------------|
| `GEMINI_API_KEY` | Google Gemini API Key |
| `CLIENT_ORIGIN` | Allowed frontend origin |

---

# 🚀 Deployment

This project is deployed on **Vercel**.

To deploy your own copy:

1. Fork this repository
2. Import the repository into Vercel
3. Add the required environment variables
4. Deploy

---

# 💡 Challenges Solved

During development, the following engineering challenges were addressed:

- Secure API key management
- Serverless deployment on Vercel
- AI prompt engineering for structured JSON output
- Handling invalid and spam reviews
- Responsive dashboard design
- Shareable report generation
- Error handling for AI service failures

---

# 🔮 Future Improvements

- User authentication
- Saved analysis history
- PDF export
- CSV export
- Product comparison
- Team workspaces
- Analytics dashboard
- Streaming AI responses
- Dark mode customization

---

# 👨‍💻 Author

**Debraj Sarkar**

GitHub: https://github.com/Debrajx77

LinkedIn: https://linkedin.com/in/your-linkedin

Portfolio: https://your-portfolio.com

---

# 📜 License

This project is licensed under the MIT License.

---

## ⭐ Support

If you found this project useful, please consider giving it a ⭐ on GitHub.

It helps support future development and makes the project easier for others to discover.

---

<p align="center">
Built with ❤️ using React, Express, Tailwind CSS and Google Gemini AI.
</p>
