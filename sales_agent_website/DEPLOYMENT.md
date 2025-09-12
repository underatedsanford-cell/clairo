# Deployment and Google Services Integration Guide

This guide provides instructions for deploying the application and integrating Google services.

## Prerequisites

- Node.js (v18 or later)
- npm
- A Vercel account for deployment
- A Google Cloud Platform (GCP) account for Google services integration

## Environment Setup

1.  **Clone the repository:**

    ```bash
    git clone <repository-url>
    cd <repository-directory>
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Set up environment variables:**

    Create a `.env.local` file in the root of the project and add the following environment variables:

    ```
    # Supabase
    NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
    NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>

    # Google Sheets
    GOOGLE_SHEET_ID=<your-google-sheet-id>
    GOOGLE_SERVICE_ACCOUNT_EMAIL=<your-google-service-account-email>
    GOOGLE_PRIVATE_KEY=<your-google-private-key>
    ```

## Building and Running the Application

-   **To run the application in development mode:**

    ```bash
    npm run dev
    ```

-   **To build the application for production:**

    ```bash
    npm run build
    ```

-   **To start the production server:**

    ```bash
    npm start
    ```

## Deployment

We recommend deploying the application to Vercel.

1.  **Install the Vercel CLI:**

    ```bash
    npm i -g vercel
    ```

2.  **Deploy the application:**

    ```bash
    vercel
    ```

    Follow the prompts to link the project and deploy.

## Google Services Integration

### Google Sheets API

1.  **Enable the Google Sheets API:**

    -   Go to the [Google Cloud Console](https://console.cloud.google.com/).
    -   Create a new project or select an existing one.
    -   In the navigation menu, go to **APIs & Services > Library**.
    -   Search for "Google Sheets API" and enable it.

2.  **Create a service account:**

    -   In the navigation menu, go to **APIs & Services > Credentials**.
    -   Click **Create credentials > Service account**.
    -   Fill in the service account details and grant it the **Editor** role.
    -   Click **Done**.

3.  **Create a service account key:**

    -   In the **Credentials** page, click on the service account you just created.
    -   Go to the **Keys** tab.
    -   Click **Add Key > Create new key**.
    -   Select **JSON** as the key type and click **Create**.
    -   A JSON file will be downloaded. This file contains your `GOOGLE_SERVICE_ACCOUNT_EMAIL` and `GOOGLE_PRIVATE_KEY`.

4.  **Share the Google Sheet with the service account:**

    -   Open the Google Sheet you want to use.
    -   Click **Share**.
    -   Add the service account email address (`<your-google-service-account-email>`) and give it **Editor** permissions.