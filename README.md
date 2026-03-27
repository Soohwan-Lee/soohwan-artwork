# Social Psychology & HCI Artworks Archive

This is a Next.js (App Router) based personal web archive for interactive artworks inspired by social psychology phenomena. It features a premium dark-mode aesthetic and is designed for seamless deployment on Vercel.

## 🎨 How to Add a New Artwork

You (or any AI assistant like Antigravity, Cursor, or Claude) can add a new artwork without modifying any UI or CSS code. The entire platform is data-driven.

1. Open the file `src/data/artworks.ts`.
2. Locate the `artworks` array.
3. Append a new object to the end of the array using the following structure:

```typescript
{
  id: "unique-kebab-case-theory-id", // Used for the URL path: /artwork/[id]
  number: "/04", // Sequential number for the grid UI. Increment as needed.
  theoryName: "Psychology Theory Name", // e.g., "Halo Effect"
  description: "A short summary shown on the homepage grid card.",
  liveUrl: "https://your-hosted-artwork-url.com", // The interactive artwork to be embedded via iframe
  detailedExplanation: "A full paragraph explaining the social psychology theory and how the artwork visualizes it..." // Shown below the iframe on the detail page
}
```

4. **Save the file** and push your changes to GitHub.
5. If the repository is connected to **Vercel**, the site will automatically rebuild and deploy. The new artwork will dynamically appear on the homepage grid, and its dedicated detail page will be automatically generated.

## 💻 Local Development

To preview changes or run the project locally:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
