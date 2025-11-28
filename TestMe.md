# Mini DevTools Mobile Testing Checklist

## Overview
This checklist covers the mobile-responsive overhaul for the Mini DevTools drawer component. Test on Chrome (last 2 versions) for Android devices.

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

## Layout & Dimensions

### Drawer Width
- [ ] Mobile (< 768px): Drawer takes 100% screen width
- [ ] Desktop (≥ 768px): Drawer maintains 420px fixed width
- [ ] No horizontal scroll anywhere in the drawer
- [ ] No content overflow causing horizontal scroll on body

### Icon Rail / Tab Bar
- [ ] Mobile: Horizontal scrollable tab bar at TOP of drawer
- [ ] Mobile: Tab bar scrolls horizontally when many tabs present
- [ ] Mobile: Active tab auto-scrolls into view
- [ ] Desktop: Vertical icon rail on LEFT side (unchanged)
- [ ] Smooth transition when resizing browser across breakpoints

---

## Touch Interactions

### Touch Targets
- [ ] All icon buttons are at least 44px on mobile (48px target)
- [ ] Adequate spacing between icons prevents mis-taps
- [ ] Touch targets feel responsive (no delay)

### Close Methods
- [ ] X button closes drawer (both mobile and desktop)
- [ ] Swipe-right-to-close works on mobile (threshold ~50px)
- [ ] Swipe gesture does NOT interfere with vertical scrolling
- [ ] Backdrop tap closes drawer (existing behavior preserved)
- [ ] Escape key closes drawer (existing behavior preserved)

### MiniDevButton
- [ ] Button is tappable and visible on all device sizes
- [ ] Button doesn't overlap phone navigation bar
- [ ] Button doesn't overlap notch/camera cutout areas
- [ ] Red notification dot visible when errors present

---

## Safe Areas & Device Chrome

### Safe Area Insets
- [ ] Content doesn't hide behind iOS home indicator
- [ ] Content doesn't hide behind Android gesture bar
- [ ] Drawer has appropriate bottom padding on notched phones
- [ ] MiniDevButton positioned above navigation bars

### Device-Specific
- [ ] Test with Android navigation bar visible
- [ ] Test with Android gesture navigation enabled
- [ ] Test with different system font sizes (accessibility)

---

## Panel Content Testing

### All Panels Accessibility
- [ ] Overview panel readable and scrollable
- [ ] Audio panel controls accessible
- [ ] Video/Animation panel usable
- [ ] Text/Content panel readable
- [ ] APIs panel scrollable with all content visible
- [ ] MCP/Agents panel functional
- [ ] Flowchart panel renders (may need separate fix)
- [ ] UI Tokens panel displays correctly
- [ ] Logs panel scrollable
- [ ] Security panel accessible
- [ ] Pipeline Monitor panel functional
- [ ] Panel Generator panel usable
- [ ] Style Guide panel readable
- [ ] Shortcuts panel visible
- [ ] Export Report panel functional

### Content Layout
- [ ] Cards stack vertically on mobile (single column)
- [ ] Cards use 2-column grid on desktop (where applicable)
- [ ] Text doesn't overflow containers
- [ ] Code blocks are scrollable horizontally
- [ ] Tables are scrollable or responsive

---

## Performance & Animation

- [ ] Drawer open/close animation smooth (60fps target)
- [ ] No jank during scroll
- [ ] Touch response feels immediate
- [ ] No layout thrashing during interaction

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

