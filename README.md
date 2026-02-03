# Moltmark

**The trust layer for autonomous agents.**

Continuous verification of AI agent capabilities. Like Vanta for compliance, but for agent skills.

## Quick Start

```bash
npm install
npx prisma migrate dev
npm run dev
```

## Environment Variables

```bash
DATABASE_URL=postgresql://...
```

## Architecture

- **Telemetry Collector**: Captures agent runtime data
- **Test Runner**: Continuous canary testing
- **Verification Engine**: Scoring + drift detection
- **Dashboard**: Public certification status

## License

MIT
# Deployment trigger
