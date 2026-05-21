# Manual Test Checklist: Hamburger Menu & Back Navigation

**URL**: http://localhost:3001

## Hamburger Menu Tests

### Home Page (/)
- [ ] Hamburger button visible (top-left corner or menu icon)
- [ ] Click hamburger → sidebar slides in from LEFT (smooth animation)
- [ ] Sidebar displays in order:
  - [ ] Yoom logo + X close button
  - [ ] Home (with 🏠 icon)
  - [ ] Start Recording (with ⏺️ icon)
  - [ ] Manage Recordings (with 📁 icon)
  - [ ] Settings (with ⚙️ icon)
  - [ ] Divider line
  - [ ] Sign Out button (with 🚪 icon)
  - [ ] "Yoom v1.0" footer text
- [ ] Backdrop overlay visible (dark semi-transparent)
- [ ] Click X button → sidebar slides out LEFT (closes)
- [ ] Click backdrop → sidebar closes
- [ ] Click "Start Recording" → sidebar closes + navigates to /recorder
- [ ] Click "Manage Recordings" → sidebar closes + navigates to /recordings
- [ ] Click "Settings" → sidebar closes + navigates to /settings
- [ ] Click "Sign Out" → sidebar closes + redirects to /login
- [ ] Press ESC key → sidebar closes
- [ ] Sidebar width is ~288px (w-72)

### Recorder Page (/recorder)
- [ ] Back arrow visible (top-left)
- [ ] Hamburger button visible (top-right)
- [ ] Click back arrow → navigates to home (/)
- [ ] Click hamburger → sidebar opens (same behavior as home)
- [ ] All sidebar navigation works

### Recordings Page (/recordings)
- [ ] Back arrow visible (top-left)
- [ ] Hamburger button visible (top-right)
- [ ] Click back arrow → navigates to home (/)
- [ ] Click hamburger → sidebar opens
- [ ] All sidebar navigation works

### Settings Page (/settings)
- [ ] Back arrow visible (top-left)
- [ ] Hamburger button visible (top-right)
- [ ] Click back arrow → navigates to home (/)
- [ ] Click hamburger → sidebar opens
- [ ] All sidebar navigation works

## Animation Quality
- [ ] Slide-in animation smooth (300ms duration)
- [ ] Slide-out animation smooth
- [ ] No flicker or jump during animation
- [ ] Backdrop fades in smoothly
- [ ] Hover states on all buttons (color change)
- [ ] Active state on click (scale down slightly)

## Mobile Responsiveness (if testing on mobile)
- [ ] Hamburger button accessible
- [ ] Sidebar takes full height on mobile
- [ ] Touch targets large enough (44px min)
- [ ] Back arrow easily tappable

## Accessibility
- [ ] All buttons have aria-labels
- [ ] Keyboard navigation works (Tab through buttons)
- [ ] ESC key closes sidebar
- [ ] Focus management (focus returns to triggering button)

## Visual Polish
- [ ] Consistent spacing (padding-4, gap-3)
- [ ] Border radius on buttons (rounded-lg)
- [ ] Colors match design system (surface, border, muted, accent)
- [ ] Icons properly sized (24px)
- [ ] Text legible (proper contrast)

## Browser Console
- [ ] No JavaScript errors
- [ ] No warnings about missing props
- [ ] No hydration mismatches

---

**Status**: ✅ PASS / ❌ FAIL
**Tester**: ___________
**Date**: ___________
**Notes**: _________________________
