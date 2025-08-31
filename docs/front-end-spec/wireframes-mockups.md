# Wireframes & Mockups

**Primary Design Files:** [Ссылка будет добавлена при создании в Figma/v0]

### Key Screen Layouts

#### Main Feed Layout

**Purpose:** Центральный hub для просмотра всех постов с возможностью быстрого взаимодействия

**Key Elements:**
- Sticky navigation header с логотипом, поиском, профилем
- Floating action button "+" для создания поста
- Post cards с author, content, timestamp, reactions, comments
- Infinite scroll для дополнительного контента
- Empty state с call-to-action для первого поста

**Interaction Notes:** 
- Pull-to-refresh для обновления ленты
- Smooth scrolling с lazy loading
- Heart animation при клике (scale + color transition)
- Keyboard navigation support для accessibility

**Design File Reference:** [main-feed-layout.frame]

#### Post Creation Modal

**Purpose:** Focused environment для создания контента без отвлекающих элементов

**Key Elements:**
- Large text area с placeholder "What's on your mind?"
- Character counter (280/280) с цветовыми индикаторами
- Mood selector buttons (Happy, Thoughtful, Excited, etc.)
- Cancel и Publish кнопки
- Auto-expanding текстовое поле

**Interaction Notes:**
- Modal overlay с backdrop blur
- Auto-focus на текстовое поле при открытии
- Real-time character counting
- Disabled publish button для invalid states
- Escape key для закрытия

**Design File Reference:** [post-creation-modal.frame]

#### Profile Page Layout

**Purpose:** Персональный dashboard для управления контентом и профильной информацией

**Key Elements:**
- Profile header с avatar, name, bio, join date
- Edit profile button для владельца
- Tabs: "My Posts" (default), "Liked Posts"
- Grid/list view toggle для постов
- Post management actions (edit/delete) на собственных постах

**Interaction Notes:**
- Editable profile info с inline editing
- Confirmation dialogs для destructive actions
- Smooth transitions между tabs
- Responsive layout для mobile/desktop

**Design File Reference:** [profile-page-layout.frame]