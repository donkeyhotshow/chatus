# 🗺️ CHATUS — ROADMAP & IMPROVEMENT PLAN

> **Status:** 🔴 CRITICAL PHASE (Fixing Blockers)
> **Last Updated:** 2025-12-17

## 🚨 1. CRITICAL ISSUES (Blockers)

### 1.1. Access & Auth
- [ ] **Disable Vercel Authentication** (User Action Required in Dashboard)
- [ ] **Verify Demo Mode** (Ensure app works without Firebase for testing)
- [ ] **Documentation** (Clear launch instructions)

### 1.2. Monitoring & Logging
- [ ] **Sentry Integration** (Error tracking)
- [ ] **Vercel Analytics** (Performance monitoring)
- [ ] **Global Error Boundaries** (Graceful failure handling)

## 📱 2. MOBILE UX (The "Main Failure")

### 2.1. Input & Keyboard
- [ ] **Fix Keyboard Overlap** (Implement `visualViewport` handling)
- [ ] **Ensure Input Visibility** (Bottom input must stay visible)
- [ ] **Touch Targets** (Increase to ≥ 44px)
- [ ] **Visual Feedback** (Active states for taps)

### 2.2. Tablet Adaptation
- [ ] **Fix Horizontal Scroll**
- [ ] **Fix Avatar Cropping**
- [ ] **Stabilize Grid Layout** (768–1024px)

## 🛠️ 3. FUNCTIONAL GAPS

- [ ] **Message Statuses** (Sent/Delivered/Read)
- [ ] **Search** (Chats & Messages)
- [ ] **Infinite Scroll** (History loading)
- [ ] **Offline Mode** (PWA capabilities)
- [ ] **Background Notifications**

## ♿ 4. ACCESSIBILITY (A11y)

- [ ] **ARIA Labels** (All interactive elements)
- [ ] **Contrast Ratios** (Text vs Background)
- [ ] **Keyboard Navigation** (Focus management)

## 📈 5. PRODUCT MATURITY

- [ ] **SEO Optimization** (Meta tags, sitemap)
- [ ] **PWA Implementation** (Manifest, Service Worker)
- [ ] **Analytics** (User behavior)
- [ ] **Testing** (E2E, Unit)

---

## 📅 EXECUTION PLAN

### **STAGE 0: UNLOCK (Immediate)**
- [ ] Remove Vercel Auth / Configure Bypass
- [ ] Validate Demo Mode
- [ ] Update Runbook

### **STAGE 1: STABILITY (Week 1)**
- [ ] Setup Sentry
- [ ] Setup Vercel Analytics
- [ ] Harden Error Boundaries

### **STAGE 2: MOBILE UX (Week 2)**
- [ ] Fix Keyboard/Input issues
- [ ] Optimize Touch Targets
- [ ] Fix Tablet Layouts

### **STAGE 3: FEATURES (Week 3)**
- [ ] Message Statuses
- [ ] Infinite Scroll
- [ ] Search

### **STAGE 4: QUALITY (Week 4-5)**
- [ ] PWA
- [ ] Lighthouse > 90
- [ ] A11y Audit
