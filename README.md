# INTENT AI - Prompt Generation & Discovery Platform

A modern web application for generating, discovering, and managing AI prompts with multi-LLM support (Claude & OpenAI).

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ (install with [nvm](https://github.com/nvm-sh/nvm#installing-and-updating))
- Supabase account (free tier sufficient)
- OpenAI API key (optional, Claude preferred)

### Setup

```bash
# 1. Clone and install
git clone <your-repo-url>
cd INTENT_AI
npm install

# 2. Configure environment (.env.local)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_OPENAI_API_KEY=your_openai_key_optional
ANTHROPIC_API_KEY=your_claude_key

# 3. Run development server
npm run dev

# 4. Build for production
npm run build
```

## 📁 Project Structure

```
src/
├── components/        # React components
│   ├── landing/      # Landing page sections
│   ├── ui/           # shadcn/ui components
│   └── *.tsx         # Main layout components
├── pages/            # Application pages (routing)
├── services/         # Business logic
│   └── multiLLMGenerator.ts    # Claude/OpenAI integration
├── hooks/            # Custom React hooks
│   └── useDatabase.ts          # Database queries
├── contexts/         # React context providers
├── lib/              # Utilities and helpers
└── integrations/     # External service clients
    └── supabase/     # Supabase client & types
```

## 🛠️ Tech Stack

- **Frontend**: React 18.3 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: Supabase PostgreSQL
- **AI**: Claude (Anthropic) + OpenAI (fallback)
- **Testing**: Vitest + E2E tests

## ✨ Key Features

- 🤖 **Multi-LLM Support**: Claude with OpenAI fallback
- 📝 **Prompt Generation**: Create optimized AI prompts
- 🔍 **Prompt Discovery**: Search and filter community prompts
- 💾 **Save Library**: Bookmark favorite prompts
- 📊 **Analytics**: Track usage and performance
- 🎯 **Categories**: Organized by tool and difficulty level
- 🌙 **Dark Mode**: Full theme support

## 📚 Documentation

- **[DATABASE_REQUIREMENTS.md](./DATABASE_REQUIREMENTS.md)** - Database schema and data flow
- **[SUPABASE_DEPLOYMENT_GUIDE.md](./SUPABASE_DEPLOYMENT_GUIDE.md)** - Deployment instructions
- **[QUICK_START.md](./QUICK_START.md)** - Detailed setup guide
- **[PHASE_PLAN.md](./PHASE_PLAN.md)** - Development roadmap

## 🔑 Environment Variables

```env
# Supabase (Required)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# AI Providers (Optional - Claude or OpenAI)
ANTHROPIC_API_KEY=your_claude_key
VITE_OPENAI_API_KEY=your_openai_key

# Optional
ANTHROPIC_BASE_URL=https://api.z.ai/api/anthropic
```

## 🚀 Deployment

The application is production-ready and can be deployed to:
- Vercel (recommended)
- Netlify
- AWS Amplify
- Any Node.js hosting

See [SUPABASE_DEPLOYMENT_GUIDE.md](./SUPABASE_DEPLOYMENT_GUIDE.md) for detailed steps.

## 📖 Available Scripts

```bash
npm run dev       # Start development server
npm run build     # Build for production
npm run preview   # Preview production build
npm run test      # Run unit tests
npm run lint      # Check code quality
npm run type-check # TypeScript type checking
```

## 🤝 Architecture

The application follows a clean, layered architecture:

1. **Components Layer**: Reusable UI components
2. **Pages Layer**: Application routes and page composition
3. **Services Layer**: Business logic (prompt generation, LLM integration)
4. **Hooks Layer**: Custom React hooks for data fetching
5. **Integration Layer**: External services (Supabase, AI APIs)

## 📝 Development Workflow

1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes and test locally
3. Commit changes: `git commit -m "feat: description"`
4. Push to branch: `git push origin feature/your-feature`
5. Create Pull Request

## 🐛 Troubleshooting

**Build fails**: Ensure Node.js version is 18+
**API errors**: Check environment variables and API keys
**Database errors**: Verify Supabase connection and migrations

## 📄 License

MIT License - See LICENSE file for details

## 🎯 Status

✅ Core features complete  
✅ Multi-LLM integration working  
✅ Database schema deployed  
✅ Production ready  

## 📞 Support

For issues and questions:
1. Check existing documentation files
2. Review error logs in console
3. Check Supabase dashboard for database issues

---

**Last Updated**: February 2025  
**Version**: 1.0.0

