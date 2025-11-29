# UI Bug Bash 1 - Desktop Issues Report

**Date:** November 29, 2024  
**Reviewer:** AI Assistant  
**Scope:** Desktop UI Review (Medium Level)

---

## 🔴 Critical Issues (Blocking UX)

### 1. Header Overlap on Medium Screens
- **Location:** `src/components/Header.tsx`
- **Issue:** Header buttons (Gallery, Templates, Assets, Studio, Debug, Projects) can overlap on screens between 768px-1024px
- **Impact:** Buttons may be cut off or overlap with each other
- **Fix:** Implement progressive disclosure or reduce button count in header

### 2. System Health Panel Overlap
- **Location:** Top right corner (visible in screenshot)
- **Issue:** "System Health" badges (8 Healthy, 2 Degraded, 1 Failed) overlap with main header area
- **Impact:** Visual clutter and unclear hierarchy
- **Fix:** Move to dropdown or dedicated status bar

---

## 🟠 Major Issues (Significant UX Impact)

### 3. Left Sidebar Width Constraints
- **Location:** `src/components/LeftSidebar.tsx`
- **Issue:** Fixed w-80 (320px) may be too wide on smaller desktop screens, cramping center workspace
- **Impact:** Reduces canvas area on 1366x768 displays
- **Fix:** Make collapsible or adjustable width

### 4. Quick Create Buttons Crowded
- **Location:** Left sidebar "Quick Create" section
- **Issue:** Image/Video/Audio buttons in 3-column grid are tight at 16px height
- **Impact:** Small tap targets, hard to read labels
- **Fix:** Increase height to h-20 or switch to vertical layout

### 5. Canvas Tab Bar Overflow
- **Location:** `src/components/CanvasTabBar.tsx`
- **Issue:** Horizontal scrolling tabs can become hard to navigate with many canvases
- **Impact:** Users lose track of open canvases
- **Fix:** Add tab dropdown for overflow, show active count

### 6. Right Sidebar Tab Labels Cramped
- **Location:** `src/components/RightSidebar.tsx`
- **Issue:** Edit/Layers/Properties tabs at text-xs with icons are cramped
- **Impact:** Labels may truncate, icons barely visible
- **Fix:** Use icon-only tabs with tooltips, or expand width

### 7. Timeline Track Labels Too Narrow
- **Location:** `src/components/workspace/Track.tsx`
- **Issue:** Track label area (w-24) with icon + text + mute/lock buttons is cramped
- **Impact:** Buttons overlap on narrower viewports
- **Fix:** Increase to w-28 or make controls appear on hover

---

## 🟡 Minor Issues (Polish Needed)

### 8. Toolbar Tool Groups Not Clear
- **Location:** `src/components/ToolbarTop.tsx`
- **Issue:** "More Tools" uses native `<details>` element, doesn't match design system
- **Impact:** Inconsistent styling with rest of UI
- **Fix:** Use shadcn DropdownMenu component

### 9. Playback Controls Double Display
- **Location:** `src/components/workspace/PlaybackControls.tsx` + `TransportControls.tsx`
- **Issue:** Both components show similar transport controls, potential duplication
- **Impact:** Confusion about which controls to use
- **Fix:** Consolidate into single transport bar

### 10. Gallery Header Actions Crowded
- **Location:** `src/components/Gallery.tsx`
- **Issue:** "Manage Categories" + "Actions (X)" + "Upload" buttons tight in header
- **Impact:** Text may truncate on narrow gallery panel
- **Fix:** Move to icon-only with tooltips or dropdown

### 11. Brush Tool Panel Overflow
- **Location:** `src/components/ToolbarTop.tsx` line 201-278
- **Issue:** Brush size/opacity/hardness sliders + color picker overflow on narrow screens
- **Impact:** Controls wrap awkwardly
- **Fix:** Use collapsible sections or popover for advanced controls

### 12. Demo Asset Placeholder Images
- **Location:** Left sidebar "Recent Assets"
- **Issue:** Demo Purple/Demo Cyan show as gradient placeholders instead of real images
- **Impact:** Looks unfinished/broken
- **Fix:** Remove demo assets or use proper placeholder service

### 13. Edit Panel Button Grid
- **Location:** `src/components/EditPanel.tsx`
- **Issue:** Crop/Resize/Color buttons in 3-column grid with text-xs labels
- **Impact:** Hard to read, cramped feel
- **Fix:** Use larger buttons or horizontal layout

### 14. Image Canvas Header Cramped
- **Location:** `src/components/Canvas/ImageCanvas.tsx`
- **Issue:** ProjectSaveLoad + Undo + Redo + Download + Delete all in one row
- **Impact:** Buttons may overlap with long canvas names
- **Fix:** Group into dropdown or use icon-only buttons

### 15. Timeline Zoom Controls Position
- **Location:** `src/components/workspace/TimelineRail.tsx`
- **Issue:** Zoom controls floating bottom-right can overlap with timeline content
- **Impact:** May cover clips when zoomed in
- **Fix:** Move to fixed toolbar area

---

## 🔵 Enhancement Opportunities

### 16. Missing Loading States
- **Location:** Throughout UI
- **Issue:** Many async operations don't show loading indicators
- **Impact:** Users unsure if action is processing
- **Fix:** Add skeleton loaders and spinners consistently

### 17. No Keyboard Navigation Indicators
- **Location:** Global
- **Issue:** Focus rings not consistently visible across all interactive elements
- **Impact:** Keyboard users can't see current focus
- **Fix:** Add visible focus-visible styles

### 18. Inconsistent Spacing
- **Location:** Various panels
- **Issue:** p-2, p-3, p-4 used inconsistently across similar components
- **Impact:** Visual rhythm feels off
- **Fix:** Standardize spacing scale usage

### 19. Missing Empty State Illustrations
- **Location:** Gallery, Canvases, Timeline
- **Issue:** Empty states use only text, no visual illustration
- **Impact:** Feels cold and uninviting
- **Fix:** Add friendly illustrations for empty states

### 20. Badge Overflow in Asset Cards
- **Location:** `src/components/Gallery.tsx`
- **Issue:** Multiple badges (type, size, provider) can overflow card width
- **Impact:** Badges wrap or get cut off
- **Fix:** Limit visible badges, show rest on hover

---

## 📋 Summary

| Severity | Count |
|----------|-------|
| 🔴 Critical | 2 |
| 🟠 Major | 5 |
| 🟡 Minor | 8 |
| 🔵 Enhancement | 5 |
| **Total** | **20** |

---

## 🎯 Recommended Priority Order

1. Fix Header Overlap (#1)
2. Fix System Health Panel position (#2)
3. Make Left Sidebar collapsible (#3)
4. Consolidate Transport Controls (#9)
5. Fix Timeline Track Labels (#7)
6. Polish remaining minor issues

---

*This document is part of the UI Bug Bash initiative. Issues listed here have NOT been fixed - this is an audit document for review and prioritization.*
