<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1XfmEXKy0YwJ2t511Vw9chTTM20bYjCXd

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Android (Capacitor)

1. Install dependencies:
   `npm install`
2. Build the web bundle:
   `npm run build`
3. Sync Capacitor assets:
   `npx cap copy`
4. Open Android Studio:
   `npx cap open android`

## Folio Images

Place the quick-guide images in `public/folio` using these filenames:
- `brief-forms-1.jpg`
- `brief-forms-2.jpg`
- `brief-forms-3.jpg`
- `brief-forms-4.jpg`
- `brief-forms-5.jpg`
