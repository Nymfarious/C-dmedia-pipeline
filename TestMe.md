# Mini DevTools Mobile Responsiveness Testing Checklist

## Overview
This checklist covers the complete mobile-responsive overhaul for Mini DevTools (Prompts 1-3).

---

## Device Emulation Testing (Chrome DevTools)

### Required Device Profiles
- [ ] **iPhone SE** (375px width) - Smallest common screen
- [ ] **Pixel 5** (393px width) - Standard Android
- [ ] **Galaxy S21** (360px width) - Narrow Android
- [ ] **iPad Mini** (768px width) - Tablet breakpoint boundary
- [ ] **Desktop** (1024px+ width) - Ensure no regression

### Orientation Testing
- [ ] Portrait mode on all mobile devices
- [ ] Landscape mode on all mobile devices
- [ ] Rotation during drawer open state

---

## PROMPT 1: Drawer, Button & Navigation

### 1. Responsive Drawer Width
- [ ] Mobile: Drawer takes 100% screen width
- [ ] Desktop: Drawer maintains 420px fixed width
- [ ] No horizontal scrollbar appears on any device size
- [ ] Content doesn't overflow the drawer boundaries

### 2. Adaptive Icon Rail Layout

#### Mobile (< md breakpoint):
- [ ] Icon rail converts to horizontal scrollable tab bar at TOP
- [ ] Tab bar scrolls horizontally when there are many sections
- [ ] Active tab auto-scrolls into view when drawer opens
- [ ] Icons are in a row with proper spacing (gap-1.5)

#### Desktop (>= md breakpoint):
- [ ] Vertical icon rail remains on the LEFT side
- [ ] Rail maintains w-12 width
- [ ] Icons stack vertically with proper spacing

### 3. Touch Targets
- [ ] Icon buttons are 48px (w-12 h-12) on mobile
- [ ] Icon buttons are 40px (w-10 h-10) on desktop
- [ ] Adequate spacing between icons prevents mis-taps
- [ ] Touch response is snappy (touch-manipulation applied)

### 4. MiniDevButton Positioning
- [ ] Button is 48px on mobile, 56px on desktop
- [ ] Bottom position: bottom-20 on mobile (clears nav bars)
- [ ] Bottom position: bottom-6 on desktop
- [ ] Right position: right-4 on mobile, right-6 on desktop
- [ ] Button doesn't overlap phone navigation/gesture bars
- [ ] Safe area padding is applied correctly

### 5. Content Padding
- [ ] Panel containers use p-4 on mobile
- [ ] Panel containers use p-6 on desktop
- [ ] Grids use single column on mobile (grid-cols-1)
- [ ] Grids use two columns on desktop (md:grid-cols-2)

### 6. Close Methods

#### X Button:
- [ ] X button is visible and accessible in drawer header
- [ ] X button closes the drawer when tapped
- [ ] X button has hover state (turns red/destructive)

#### Swipe Gesture (Mobile Only):
- [ ] Swiping right (left-to-right) closes the drawer
- [ ] Swipe threshold is ~50px
- [ ] Vertical scrolling inside panels still works normally
- [ ] Swipe doesn't interfere with horizontal content scrolling

### 7. Safe Area Insets
- [ ] Content doesn't hide behind iOS home indicator
- [ ] Content doesn't hide behind Android gesture bar
- [ ] Safe area classes are applied to drawer container
- [ ] Safe area classes are applied to MiniDevButton

---

## PROMPT 2: Panel Content Responsiveness

### 8. FlowchartPanel
- [ ] SVG scales to fit container width
- [ ] No horizontal overflow on mobile
- [ ] Drag is disabled on mobile
- [ ] Mobile list view fallback is shown
- [ ] Desktop drag behavior still works

### 9. LogsPanel
- [ ] Log entries stack vertically on mobile
- [ ] Timestamp, level, message are readable
- [ ] Log list height is constrained (max-h-[50vh])
- [ ] Level badges use compact text size

### 10. PipelineMonitorPanel
- [ ] Summary stats stack vertically on mobile
- [ ] Event list uses accordion pattern on mobile
- [ ] Expand/collapse targets are 44px+
- [ ] Desktop shows horizontal stats row

### 11. All Panels General
- [ ] Padding: p-4 on mobile, p-6 on desktop
- [ ] Typography: text-base md:text-lg for titles
- [ ] No horizontal scroll unless in specific table wrapper
- [ ] Cards use grid-cols-1 md:grid-cols-2

### 12. Panel-by-Panel Verification
- [ ] Overview panel readable and scrollable
- [ ] Audio panel controls accessible
- [ ] Video/Animation panel usable
- [ ] Text/Content panel readable
- [ ] APIs panel scrollable with all content visible
- [ ] MCP/Agents panel functional
- [ ] Flowchart panel renders correctly
- [ ] UI Tokens panel displays correctly
- [ ] Logs panel scrollable
- [ ] Security panel accessible
- [ ] Pipeline Monitor panel functional
- [ ] Panel Generator panel usable
- [ ] Style Guide panel readable
- [ ] Shortcuts panel visible
- [ ] Export Report panel functional

---

## PROMPT 3: Polish & Finishing Touches

### 13. Loading States
- [ ] Loading skeleton shows when switching panels
- [ ] Skeleton matches panel layout structure
- [ ] Loading spinner appears in header during transition
- [ ] No jarring blank states

### 14. Active Tab Indicator

#### Mobile:
- [ ] Active tab has border-b-2 border-primary
- [ ] Active tab has bg-primary/10 background
- [ ] Active icon scales up slightly (scale-110)
- [ ] Auto-scroll brings active tab into view

#### Desktop:
- [ ] Active tab has border-l-2 border-primary
- [ ] Active tab has bg-primary/10 background
- [ ] Active icon scales up slightly (scale-110)

### 15. Drawer Animation
- [ ] Drawer slides in smoothly (200ms ease-out)
- [ ] Backdrop fades in with drawer
- [ ] Animation is snappy, not sluggish
- [ ] Opacity transition included

### 16. Close Button Styling
- [ ] Mobile: Close button is 40px (h-10 w-10)
- [ ] Desktop: Close button is 32px (h-8 w-8)
- [ ] Hover state: red/destructive color
- [ ] Has aria-label for accessibility
- [ ] Rounded full (circle shape)

### 17. Orientation Handling
- [ ] Portrait mode works correctly
- [ ] Landscape mode doesn't break layout
- [ ] Flowchart scales in both orientations
- [ ] Drawer height adjusts properly

### 18. Dark Mode Verification
- [ ] Environment badges have proper dark: variants
- [ ] Contrast ratios are readable in dark mode
- [ ] Active states visible in both modes
- [ ] Backdrop opacity correct in dark mode

---

## Accessibility

### ARIA Attributes
- [ ] Drawer has role="dialog" and aria-modal="true"
- [ ] Tab bar has role="tablist"
- [ ] Tabs have aria-selected attribute
- [ ] Close button has aria-label
- [ ] All interactive elements have visible focus states

---

## Performance & Animation

- [ ] Drawer open/close animation smooth (60fps target)
- [ ] No jank during scroll
- [ ] Touch response feels immediate
- [ ] No layout thrashing during interaction

---

## Edge Cases

- [ ] Rapidly switching between sections doesn't break layout
- [ ] Opening/closing drawer multiple times works consistently
- [ ] Rotating device doesn't break the layout
- [ ] Very long section content scrolls properly
- [ ] Red error dot visible on Logs tab when errors exist

---

## Physical Device Testing

### Android Chrome (Required)
- [ ] Test on physical Android device
- [ ] Chrome browser (last 2 versions)
- [ ] All above tests pass on real hardware

### iOS Safari (If Available)
- [ ] Test on physical iOS device (if accessible)
- [ ] Safari browser
- [ ] Note any iOS-specific issues

---

## Regression Testing

### Desktop Functionality (Must Not Break)
- [ ] All existing keyboard shortcuts work
- [ ] All panels load correctly
- [ ] Drawer opens/closes properly
- [ ] Tooltip hovers work
- [ ] Badge/environment indicator displays
- [ ] Custom panels still render (if configured)

---

## Summary Table

| Prompt | Focus | Status |
|--------|-------|--------|
| 1 | Drawer, Button, Nav Rail, Swipe+X close | ☐ |
| 2 | Panel content, Flowchart, Tables, Logs | ☐ |
| 3 | Polish, animations, dark mode, orientation | ☐ |

---

## Notes Section

### Known Issues
_(Document any discovered issues here)_

### Device-Specific Quirks
_(Note any device-specific behavior)_

### Future Improvements
_(Suggestions for next iteration)_

---

## Sign-Off

| Tester | Date | Devices Tested | Pass/Fail |
|--------|------|----------------|-----------|
|        |      |                |           |
