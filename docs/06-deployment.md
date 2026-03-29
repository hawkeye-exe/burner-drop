# Deployment Guide

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/hawkeye-exe/burner-drop)

Deploying Burner Drop is straightforward and optimized for Vercel. This guide will walk you through setting up the necessary accounts, obtaining your API keys, and launching your own zero-trust file sharing instance.

## 1. Prerequisites

Before you begin, ensure you have the following:
- **Node.js 20+** installed on your local machine (for local development or testing).
- A **GitHub account** to fork and host your repository.
- A **Pinata account** (the free tier works perfectly) to pin your encrypted payloads to the IPFS network.

## 2. Get your PINATA_JWT

Burner Drop uses Pinata to securely pin files to IPFS. You need a JSON Web Token (JWT) to authenticate your server's requests.

1. Log in to your [Pinata dashboard](https://app.pinata.cloud/).
2. Navigate to the **API Keys** section in the left sidebar.
3. Click **New Key**.
4. Grant the key **Admin** privileges.
5. Provide a name for your key and create it.
6. **Copy the JWT** immediately and save it somewhere safe. You will not be able to view it again.

## 3. Deploy to Vercel

Vercel is the recommended hosting provider for Next.js applications like Burner Drop.

1. Go to [Vercel](https://vercel.com/) and log in with your GitHub account.
2. Click **Add New** and select **Project**.
3. **Import** your Burner Drop GitHub repository.
4. In the "Configure Project" step, expand the **Environment Variables** section.
5. Add a new variable:
   - **Name:** `PINATA_JWT`
   - **Value:** `<your copied JWT from step 2>`
6. Click **Deploy**. Vercel will automatically build and launch your application.

## 4. Body Size Configuration

By default, Next.js restricts incoming request bodies to a small size. Because Burner Drop handles encrypted file payloads up to 50MB, the project's `next.config.ts` is already pre-configured with `serverActions.bodySizeLimit` set to `52mb`. This accommodates the 50MB limit plus the overhead of metadata and cryptographic padding. No extra configuration is needed on your part.

## Important Limitation

> Rate limiting is node-local on Vercel's serverless functions. Under high load across multiple regions, a single user could exceed 10 requests. Consider Upstash Redis for production.
