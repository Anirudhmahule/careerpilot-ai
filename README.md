# CareerPilot AI

CareerPilot AI is a modern web application designed to help users identify their career readiness, analyze gaps in their resume relative to their target role, and automatically generate personalized roadmaps for skill acquisition.

## Features
- **Journey Tracking**: Define target roles and career goals.
- **Resume Analysis**: AI-powered parsing and analysis of resumes against target role requirements.
- **Taxonomy Validation**: Interactive validation to confirm AI's interpretation of your skills and experience.
- **Adaptive Roadmaps**: Auto-generated learning pathways to bridge identified gaps.
- **Readiness Insights**: Real-time scoring of your current market readiness.

## Tech Stack
- Frontend: React (TanStack Start / Router)
- UI: Shadcn UI, TailwindCSS, Lucide Icons
- State: React Context + Custom Hooks
- Backend: Supabase (PostgreSQL, Edge Functions, Row Level Security)
- Deployment: Vercel / Cloudflare

## Setup Instructions
1. Copy `.env.example` to `.env.local` and populate the Supabase credentials.
2. Run `npm install`.
3. Run `npm run dev` to start the local development server.
