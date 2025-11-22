# Financial Avatar - 3D Financial Health Visualization App

A personal financial management app that visualizes spending habits through an interactive 3D human avatar. The avatar's appearance changes based on financial behavior - becoming fitter for healthy spending on exercise/wellness, or heavier for excessive food spending.

## 🎯 Core Concept

This gamified approach makes financial tracking engaging by providing immediate visual feedback on financial health decisions through a personalized 3D avatar that reflects your spending patterns.

## 🚀 Features

### Current Features
- **Interactive 3D Avatar**: Visual representation of your financial health
- **User Authentication**: Secure login/registration system
- **Financial Dashboard**: Overview of spending and avatar health
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Real-time Updates**: Avatar changes based on financial behavior

### Planned Features
- **Transaction Management**: Add, categorize, and track expenses
- **Analytics Dashboard**: Detailed spending trends and insights
- **Avatar Customization**: Personalize your financial companion
- **Goal Setting**: Set and track financial wellness goals
- **Supabase Integration**: Full backend with database and authentication

## 🛠️ Technology Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **3D Graphics**: Three.js + React Three Fiber (planned)
- **State Management**: Zustand
- **Backend**: Supabase (PostgreSQL + Auth + Real-time)
- **UI Components**: Lucide React icons, Sonner notifications
- **Form Handling**: React Hook Form + Zod validation

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd financial-avatar
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5174`

## 🗄️ Database Setup

The app includes a comprehensive database schema with:

- **Users**: Authentication and profile management
- **Transactions**: Financial transaction tracking
- **Categories**: Spending categorization
- **Avatar States**: 3D avatar appearance and health metrics

Run the migration script in your Supabase dashboard:
```sql
-- Copy contents from supabase/migrations/initial_schema.sql
```

## 🎨 Avatar Logic

The avatar appearance is determined by:

- **Fitness Level**: Based on exercise and wellness spending
- **Weight Level**: Influenced by food and dining expenses
- **Stress Level**: Affected by overall spending frequency and budget adherence
- **Happiness Level**: Correlated with income vs. expense ratio

### Health Categories Impact
- 💪 **Exercise & Fitness**: Increases fitness level, makes avatar more muscular
- 🍔 **Food & Dining**: High spending increases weight level
- 📚 **Education**: Positive impact on happiness and stress levels
- 💰 **Savings**: Improves overall financial health score

## 📱 User Interface

### Landing Page
- Hero section with 3D avatar demonstration
- Authentication forms (login/register)
- Feature overview with interactive elements

### Dashboard
- Interactive 3D avatar display
- Financial health score
- Recent transactions overview
- Quick action buttons
- Mobile-optimized navigation

### Responsive Design
- Desktop-first approach
- Breakpoints: 1280px, 1024px, 768px, 640px
- Touch-friendly controls
- Progressive enhancement

## 🔧 Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run typecheck    # Run TypeScript compiler check
```

### Project Structure

```
src/
├── components/      # React components
│   ├── Avatar3D.tsx        # 3D avatar component
│   └── ProtectedRoute.tsx  # Authentication wrapper
├── pages/          # Page components
│   ├── LandingPage.tsx     # Landing page with auth
│   ├── Dashboard.tsx       # Main dashboard
│   ├── Transactions.tsx    # Transaction management
│   ├── Analytics.tsx      # Financial analytics
│   ├── Profile.tsx        # User profile
│   └── Settings.tsx       # App settings
├── stores/         # Zustand state management
│   └── authStore.ts       # Authentication state
├── lib/           # Utilities and configurations
│   ├── supabase.ts       # Supabase client
│   └── mockData.ts       # Mock data for development
├── types/         # TypeScript type definitions
└── utils/         # Utility functions
```

## 🚀 Deployment

### Vercel Deployment
1. Connect your GitHub repository to Vercel
2. Configure environment variables
3. Deploy with automatic CI/CD

### Environment Variables for Production
```
VITE_SUPABASE_URL=your_production_supabase_url
VITE_SUPABASE_ANON_KEY=your_production_anon_key
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🐛 Known Issues

- 3D avatar currently uses simplified 2D representation
- Full Three.js integration pending for complex 3D models
- Some advanced analytics features are placeholder

## 🔮 Roadmap

### Phase 1 (Current)
- ✅ Basic app structure and authentication
- ✅ Simplified avatar visualization
- ✅ Responsive design implementation
- ✅ Mock data support for development

### Phase 2 (Next)
- 🔄 Complete Three.js 3D avatar integration
- 🔄 Full transaction management system
- 🔄 Advanced analytics dashboard
- 🔄 Avatar customization options

### Phase 3 (Future)
- 📊 Machine learning for spending predictions
- 🎯 Gamification achievements system
- 📱 Mobile app development
- 🤖 AI-powered financial advice

## 📞 Support

For support, please open an issue in the GitHub repository or contact the development team.

---

**Financial Avatar** - Making financial wellness visual, engaging, and personal. 💰✨