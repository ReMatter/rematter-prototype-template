# Rematter PnL - Scrapyard Analytics Platform

This project is a proof of concept for analytics on profit and loss, and inventory turnover for scrapyards.

## Tech Stack & Architecture

- **Frontend Framework**: React 19 with TypeScript
- **Build Tool**: Vite
- **UI Library**: Ant Design 5.27.3
- **Routing**: Wouter 3.7.1 (lightweight React router)
- **Data Storage**: JSON files (no backend)

## Project Structure

```
src/
├── components/
│   ├── Layout/
│   │   ├── TopBar.tsx      # Header with app title, notifications, user menu
│   │   └── SideBar.tsx     # Collapsible navigation menu
│   └── common/             # Shared/reusable components
├── routes/
│   ├── dashboard/          # Main overview page with P&L metrics
│   │   ├── index.tsx       # Dashboard main view
│   │   └── components/     # Dashboard-specific components
│   ├── analytics/          # Data visualization and charts
│   │   ├── index.tsx       # Analytics main view
│   │   └── components/     # Analytics-specific components
│   └── settings/           # Configuration and user preferences
│       ├── index.tsx       # Settings main view
│       └── components/     # Settings-specific components
├── App.tsx                 # Main layout with routing
├── main.tsx                # App entry point with Ant Design ConfigProvider
└── index.css               # Global styles optimized for Ant Design
```

## Key Features

### Dashboard (`/`)
- P&L overview cards with key metrics
- Real-time statistics display
- Recent trades summary
- Portfolio overview sections

### Analytics (`/analytics`)
- Performance charts and trend analysis
- Date range selection and filtering
- Key financial metrics (Sharpe ratio, max drawdown, etc.)
- Asset allocation visualization placeholders

### Settings (`/settings`)
- User profile configuration
- API key management
- Display preferences (currency, timezone)
- Notification settings

## Layout Architecture

The application uses Ant Design's Layout system:
- **TopBar**: Fixed header across all pages
- **SideBar**: Collapsible navigation with route highlighting
- **Content**: Dynamic area that renders the current route

## Development Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint

## Data Strategy

Since this is a proof of concept without a backend:
- All data should be stored in JSON files
- Consider creating a `data/` directory for mock data
- Components should simulate API calls with local JSON imports
- Future: Can be easily migrated to real API endpoints

## Component Conventions

- Each route has its main view in `index.tsx`
- Route-specific components go in the respective `components/` subdirectory
- Shared components go in `src/components/common/`
- Use Ant Design components consistently
- Follow TypeScript best practices

## Important Notes

- The sidebar automatically highlights the current route
- All routes are configured in `App.tsx` using Wouter
- Ant Design theme is applied globally via ConfigProvider
- Responsive design considerations are built into the layout