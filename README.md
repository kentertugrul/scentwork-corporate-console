# Scentwork Corporate Console

A Next.js application for managing corporate introducers and corporate partners in the Scentwork ecosystem.

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

Dependencies are already installed. If you need to reinstall:

```bash
npm install
```

### Running the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

### Building for Production

```bash
npm run build
npm start
```

## Project Structure

- `src/ScentworkCorporateConsole.tsx` - Main component with all the console functionality
- `src/components/ui/` - shadcn/ui components (Button, Card, Input, etc.)
- `app/` - Next.js app directory with layout and page
- `src/lib/utils.ts` - Utility functions (cn helper for className merging)

## Features

The console includes:

1. **Introducer Application Form** - Public form for applying to become an introducer
2. **Introducer Dashboard** - Dashboard for introducers to manage their corporates
3. **Add Corporate Wizard** - Multi-step form to add new corporate partners
4. **Corporate Detail View** - View details of a specific corporate
5. **Corporate Onboarding Portal** - Portal for corporates to sign up
6. **Corporate Dashboard** - Dashboard for corporate partners
7. **Admin Approval Queue** - Admin interface for reviewing and approving corporates

## Technologies Used

- **Next.js 16** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI component library
- **Radix UI** - Accessible component primitives
- **Lucide React** - Icon library

## Notes

- This is a prototype UI with mock data
- Replace mock data with real API calls when integrating with backend
- All components are fully commented for easy customization

