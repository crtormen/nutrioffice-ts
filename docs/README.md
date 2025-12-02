# NutriOffice Documentation

This folder contains comprehensive guides, implementation plans, and documentation for the NutriOffice system.

## 📚 Table of Contents

### Core Documentation

- **[CLAUDE.md](../CLAUDE.md)** - Project overview, architecture, and development commands for Claude Code (in project root)
- **[NAVIGATION.md](NAVIGATION.md)** - Navigation structure and routing guide
- **[AUTH_TOKEN_REFRESH.md](AUTH_TOKEN_REFRESH.md)** - Authentication token refresh after custom claims updates

### Feature Implementation Guides

#### Invitation System
- **[INVITATION_SYSTEM.md](INVITATION_SYSTEM.md)** - Overview of the invitation system architecture
- **[EMAIL_SETUP.md](EMAIL_SETUP.md)** - Gmail SMTP configuration for sending invitation emails
- **[TESTING_INVITATIONS.md](TESTING_INVITATIONS.md)** - Testing scenarios and examples for invitations
- **[FRONTEND_PLAN.md](FRONTEND_PLAN.md)** - Frontend implementation plan for invitation features
- **[IMPLEMENTATION_REVIEW.md](IMPLEMENTATION_REVIEW.md)** - Progress tracking and review checklist

#### Permissions System
- **[PERMISSIONS_GUIDE.md](PERMISSIONS_GUIDE.md)** - Complete usage guide with 20+ examples
- **[PERMISSIONS_SUMMARY.md](PERMISSIONS_SUMMARY.md)** - Implementation summary and file structure

#### Theme Settings
- **[THEME_IMPLEMENTATION_PLAN.md](THEME_IMPLEMENTATION_PLAN.md)** - Complete theme customization system implementation
- **[THEME_IMPLEMENTATION_SUMMARY.md](THEME_IMPLEMENTATION_SUMMARY.md)** - Implementation summary and testing guide
- **[UX_IMPROVEMENTS_SUMMARY.md](UX_IMPROVEMENTS_SUMMARY.md)** - UserProfileTab redesign and theme system overview

### Testing & Quick Start

- **[QUICK_START.md](QUICK_START.md)** - 5-minute quickstart guide
- **[QUICK_TEST.md](QUICK_TEST.md)** - Quick test checklist for invitation flow
- **[TEST_GUIDE.md](TEST_GUIDE.md)** - Comprehensive testing guide with UI and cURL examples

## 🗂️ Documentation by Feature

### 1. Invitation System

**What it does:** Allows professionals to invite collaborators via email, who can then register and join the team.

**Key Documents:**
1. Start with [INVITATION_SYSTEM.md](INVITATION_SYSTEM.md) for architecture overview
2. Configure email with [EMAIL_SETUP.md](EMAIL_SETUP.md)
3. Test with [QUICK_TEST.md](QUICK_TEST.md)
4. Deep testing with [TESTING_INVITATIONS.md](TESTING_INVITATIONS.md)

**Status:** ✅ Complete and working

### 2. Permissions System

**What it does:** Granular role-based access control for different features (customers, finances, analytics, etc.)

**Key Documents:**
1. Start with [PERMISSIONS_SUMMARY.md](PERMISSIONS_SUMMARY.md) for quick overview
2. Learn usage with [PERMISSIONS_GUIDE.md](PERMISSIONS_GUIDE.md)

**Status:** ✅ Complete and working

**Quick Start:**
```tsx
// Protect a route
<PermissionGuard resource="finances" level="read">
  <FinancesPage />
</PermissionGuard>

// Conditional rendering
const { canWrite } = usePermissions();
{canWrite("customers") && <CreateButton />}
```

### 3. Theme Settings

**What it does:** Allow professionals to customize the appearance of their NutriOffice instance (colors, fonts, logo, etc.)

**Key Documents:**
1. [THEME_IMPLEMENTATION_PLAN.md](THEME_IMPLEMENTATION_PLAN.md) - Complete implementation guide
2. [UX_IMPROVEMENTS_SUMMARY.md](UX_IMPROVEMENTS_SUMMARY.md) - Overview and UserProfileTab redesign

**Status:** ✅ Complete and working

**Features:**
- 12 color presets (zinc, slate, stone, gray, neutral, red, rose, orange, green, blue, yellow, violet)
- 5 border-radius levels (0 to 1.0rem)
- 7 font families (system, inter, roboto, open-sans, lato, montserrat, poppins)
- Light/Dark/System mode with automatic system preference detection
- Brand name customization (updates document title)
- Logo upload (coming soon)
- Custom CSS support
- Real-time theme preview
- Persistent storage in Firestore

### 4. User Profile

**What it does:** Modern, elegant profile page with better UX

**Key Documents:**
- [UX_IMPROVEMENTS_SUMMARY.md](UX_IMPROVEMENTS_SUMMARY.md)

**Status:** ✅ Complete and working

**Features:**
- Hero card with gradient header
- Large avatar with camera upload button
- Separate cards for bio, contact, and professional info
- Clickable fields (phone, email, WhatsApp, website)
- Icons and hover effects

## 🚀 Getting Started

### For New Developers

1. Read [CLAUDE.md](../CLAUDE.md) for project architecture
2. Follow [QUICK_START.md](QUICK_START.md) for setup
3. Check [NAVIGATION.md](NAVIGATION.md) for routing structure

### For Feature Implementation

1. **Invitation System:** Read [INVITATION_SYSTEM.md](INVITATION_SYSTEM.md)
2. **Permissions:** Read [PERMISSIONS_GUIDE.md](PERMISSIONS_GUIDE.md)
3. **Theme Settings:** Read [THEME_IMPLEMENTATION_PLAN.md](THEME_IMPLEMENTATION_PLAN.md)

### For Testing

1. **Quick Test:** [QUICK_TEST.md](QUICK_TEST.md) - 5-minute checklist
2. **Comprehensive:** [TEST_GUIDE.md](TEST_GUIDE.md) - Full testing scenarios
3. **Invitations:** [TESTING_INVITATIONS.md](TESTING_INVITATIONS.md) - Specific to invitation flow

## 📋 Implementation Status

| Feature | Status | Documentation | Notes |
|---------|--------|---------------|-------|
| **Invitation System** | ✅ Complete | [INVITATION_SYSTEM.md](INVITATION_SYSTEM.md) | Working with email |
| **Permissions System** | ✅ Complete | [PERMISSIONS_GUIDE.md](PERMISSIONS_GUIDE.md) | Full RBAC |
| **User Profile (New)** | ✅ Complete | [UX_IMPROVEMENTS_SUMMARY.md](UX_IMPROVEMENTS_SUMMARY.md) | Modern design |
| **Theme Settings** | ✅ Complete | [THEME_IMPLEMENTATION_PLAN.md](THEME_IMPLEMENTATION_PLAN.md) | Full customization |

## 🎯 Priority Reading

### If you want to...

**Understand the project:**
→ [CLAUDE.md](../CLAUDE.md)

**Set up invitations:**
→ [INVITATION_SYSTEM.md](INVITATION_SYSTEM.md) + [EMAIL_SETUP.md](EMAIL_SETUP.md)

**Use permissions in code:**
→ [PERMISSIONS_GUIDE.md](PERMISSIONS_GUIDE.md)

**Implement theme settings:**
→ [THEME_IMPLEMENTATION_PLAN.md](THEME_IMPLEMENTATION_PLAN.md)

**Test the system:**
→ [TEST_GUIDE.md](TEST_GUIDE.md)

**Quick start:**
→ [QUICK_START.md](QUICK_START.md)

## 📝 Documentation Standards

All documentation in this folder follows these principles:

- **Clear Structure** - Easy to navigate with headings and TOC
- **Code Examples** - Real, working code snippets
- **Step-by-Step** - Numbered instructions where applicable
- **Screenshots** - Visual aids when helpful
- **Status Updates** - Current state of implementation
- **Best Practices** - Recommended approaches

## 🔄 Keeping Documentation Updated

When implementing features:

1. Update status in relevant docs
2. Add new examples to guides
3. Document any changes to architecture
4. Update this README if adding new docs

## 📞 Need Help?

- Check [CLAUDE.md](../CLAUDE.md) for project architecture
- Review feature-specific guides
- Look at code examples in documentation
- Test with provided testing guides

---

**Last Updated:** November 25, 2025

**Project:** NutriOffice-TS
**Stack:** React + TypeScript + Firebase + RTK Query
**Documentation Version:** 1.0
