# 🎓 AI Partner - Your Intelligent Study Companion

> An advanced AI-powered educational platform that transforms how students learn, practice, and excel in their studies through intelligent multi-agent assistance and collaborative knowledge sharing.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Core Components](#core-components)
- [Usage](#usage)
- [Contributing](#contributing)
- [License](#license)

## 🌟 Overview

AI Partner is a comprehensive educational platform designed to be the ultimate study companion for students and learners. It combines the power of artificial intelligence with collaborative learning to provide personalized study experiences, intelligent assessments, and resource sharing within educational organizations.

### Key Highlights

- **Multi-Agent AI System**: Powered by specialized AI agents for different learning aspects
- **Personalized Learning**: Adaptive study plans based on performance analytics
- **Collaborative Knowledge Hub**: Organization-wide resource sharing platform
- **Voice-Enabled Interaction**: Live interactive chatbot with voice capabilities
- **Performance Analytics**: Detailed insights with graphical representations

## 🚀 Features

### 🤖 StudyBuddy AI - Multi-Agentic Chatbot

An intelligent orchestrated system of specialized agents:

- **Quiz Agent**: Generates personalized quizzes based on user abilities and study topics
- **Study Assistant Agent**: Provides comprehensive study guidance and concept explanations
- **Performance Agent**: Analyzes quiz results and provides detailed performance insights
- **Orchestrator Agent**: Coordinates all agents for seamless user experience

### 📊 Performance Analytics

- Real-time performance tracking and analysis
- Visual representations using advanced graph structures
- Detailed breakdown of strengths and improvement areas
- Progress monitoring across different subjects and topics

### 📅 AI Study Planner

Intelligent roadmap generation with two modes:

#### Smart Roadmap Generator
- Analyzes past quiz performance automatically
- Identifies knowledge gaps and improvement areas
- Creates personalized study schedules
- Provides targeted resource recommendations

#### Manual Roadmap Generator
- Accepts custom user inputs and preferences
- Generates tailored study plans based on user requirements
- Flexible scheduling options

### 📚 Knowledge Nest - Unified Resource Hub

- **Organization-Based Access**: Secure login with organization IDs
- **Resource Sharing**: Upload and share notes, materials, and study resources
- **Subject-Wise Organization**: Categorized resource management
- **Cross-Platform Integration**: Direct integration with StudyBuddy AI
- **Collaborative Learning**: Foster knowledge sharing within educational communities

### 🎙️ Voice-Enabled Live Interaction

- Real-time voice interaction capabilities
- Interactive responses based on individual study patterns
- Natural conversation flow for enhanced learning experience
- Powered by Gemini Live technology


## 💻 Tech Stack

- **Frontend**: Next.js - Modern React framework for optimal performance
- **Backend**: Convex - Real-time database and backend platform
- **AI Engine**: Google Gemini SDK - Advanced language model integration
- **Voice Technology**: Gemini Live - Real-time voice interaction capabilities
- **Database**: Convex built-in database system
- **Authentication**: Organization-based secure access via the organisation domain

## 🛠️ Core Components

### StudyBuddy AI Agents

```javascript
// Agent Architecture Overview
const studyBuddyAgents = {
  quizAgent: {
    responsibility: "Generate personalized quizzes",
    capabilities: ["Adaptive difficulty", "Topic-based generation", "Performance tracking"]
  },
  studyAssistant: {
    responsibility: "Comprehensive study guidance",
    capabilities: ["Concept explanation", "Resource integration", "Learning path optimization"]
  },
  performanceAgent: {
    responsibility: "Analytics and insights",
    capabilities: ["Progress tracking", "Visual analytics", "Improvement recommendations"]
  },
  orchestrator: {
    responsibility: "Agent coordination",
    capabilities: ["Request routing", "Response optimization", "Context management"]
  }
}
```

### Knowledge Management

```javascript
// Knowledge Nest Structure
const knowledgeNest = {
  organization: "Secure organization-based access",
  subjects: "Categorized resource organization",
  sharing: "Collaborative resource platform",
  integration: "Direct StudyBuddy AI connection"
}
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm or yarn package manager
- Convex account and setup
- Google Cloud Platform account (for Gemini SDK)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/ai-partner.git
   cd ai-partner
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Configure your environment variables:
   ```
   CONVEX_DEPLOYMENT=your_convex_deployment
   NEXT_PUBLIC_CONVEX_URL=your_convex_url
   GEMINI_API_KEY=your_gemini_api_key
   GEMINI_LIVE_API_KEY=your_gemini_live_key
   ```

4. **Set up Convex**
   ```bash
   npx convex dev
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Access the application**
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📖 Usage

### For Students

1. **Login** with your organization ID
2. **Interact with StudyBuddy AI** for personalized study assistance
3. **Take quizzes** to test your knowledge and track progress
4. **Access study plans** generated based on your performance
5. **Share and access resources** through Knowledge Nest
6. **Use voice interaction** for enhanced learning experience

### For Organizations

1. **Set up organization profiles** for secure resource sharing
2. **Enable students** to collaborate and share study materials
3. **Monitor progress** through performance analytics
4. **Customize learning paths** based on organizational requirements

## 🎯 Roadmap

- [ ] Advanced performance prediction models
- [ ] Mobile application development
- [ ] Integration with popular LMS platforms
- [ ] Offline study capabilities
- [ ] Gamification features
- [ ] Advanced voice interaction features
- [ ] Multi-language support
- [ ] API for third-party integrations

## 🤝 Contributing

We welcome contributions from the community! Please read our [Contributing Guidelines](CONTRIBUTING.md) for details on how to submit pull requests, report issues, and contribute to the project.

### Development Guidelines

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

- **Documentation**: [Project Wiki](wiki-link)
- **Issues**: [GitHub Issues](issues-link)
- **Discussions**: [GitHub Discussions](discussions-link)
- **Email**: support@ai-partner.com

## 🙏 Acknowledgments

- Google Gemini team for providing advanced AI capabilities
- Convex team for the robust backend platform
- Next.js community for the excellent framework
- All contributors and beta testers

---

<div align="center">
  <strong>Made with ❤️ for students worldwide</strong>
  <br>
  <sub>Empowering education through artificial intelligence</sub>
</div>