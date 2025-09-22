# Vercel Deployment Guide

This guide provides instructions for deploying the Sales Agent application to Vercel.

## Vercel Configuration

When deploying to Vercel, use the following settings:

- **Framework**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`
- **Development Command**: `npm run dev`

## Environment Variables

You will need to add the following environment variables to your Vercel project:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL`
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL`
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL`
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

These can be found in your Clerk and Supabase project settings.

## Deployment

Once you have configured your Vercel project and added the environment variables, you can deploy the application by pushing your code to the connected Git repository.