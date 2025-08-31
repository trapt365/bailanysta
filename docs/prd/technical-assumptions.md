# Technical Assumptions

### Repository Structure: Monorepo
Single repository containing both frontend application and any backend services (if implemented) to simplify development and deployment processes within time constraints.

### Service Architecture
**Frontend-First Monolith**: React-based single-page application with client-side state management and JSON file storage. Optional Express.js backend for Level 2 API integration serving as lightweight REST API for data persistence and external service integration.

### Testing Requirements
**Unit + Integration Testing**: Jest for component testing with React Testing Library for integration scenarios. Focus on critical user flows (post creation, reactions, comments) with automated testing for core functionality. Manual testing protocols for user experience validation and 30-second demo flow verification.

### Additional Technical Assumptions and Requests

• **Framework Choice**: React 18+ with Vite for rapid development and hot module replacement
• **Styling System**: Tailwind CSS for rapid prototyping and consistent design system implementation  
• **State Management**: React useState/useContext for MVP simplicity, upgradeable to Zustand or Redux if needed
• **Data Persistence**: JSON file storage for Level 1, upgradeable to REST API with Express.js for Level 2
• **Deployment Target**: Vercel preferred for automatic GitHub integration and serverless function support
• **Performance**: Bundle size under 500KB for fast loading on mobile networks
• **Browser Support**: Modern browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
• **Development Environment**: Node.js 18+ with npm/yarn package management
• **Code Quality**: ESLint and Prettier for consistent code formatting and error detection