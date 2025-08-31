# Component Library / Design System

**Design System Approach:** Создание легкой design system с фокусом на социальные взаимодействия. Использование существующих паттернов (Material/iOS) с уникальными акцентами для mood-based features.

### Core Components

#### Post Card Component

**Purpose:** Основной строительный блок для отображения пользовательского контента

**Variants:**
- Standard post (default)
- Own post (с управляющими кнопками)
- Mood post (с эмоциональными индикаторами)

**States:**
- Default, Hover, Loading
- Liked/Unliked для heart button
- Expanded/Collapsed для длинного контента

**Usage Guidelines:** 
- Максимальная высота 300px с scroll для длинного контента
- Consistent padding (16px) и typography scale
- Mood indicators через subtle color accents

#### Reaction Button Component

**Purpose:** Универсальная кнопка для эмоциональных реакций (лайки, дислайки в будущем)

**Variants:**
- Heart (primary reaction)
- Future: Laugh, Sad, Angry для расширенных эмоций

**States:**
- Inactive (outline), Active (filled), Disabled, Loading
- Hover animation (scale 1.1)
- Click animation (bounce + color change)

**Usage Guidelines:**
- Minimum touch target 44px для accessibility
- Consistent animation timing (200ms ease-out)
- Color inheritance от theme system

#### Input Field Component

**Purpose:** Универсальное поле ввода для постов, комментариев, поиска

**Variants:**
- Single line (search, username)
- Multi-line (post creation, comments)
- With character counter
- With mood selector

**States:**
- Empty, Typing, Valid, Invalid, Disabled
- Focus states с border color changes
- Error states с validation messages

**Usage Guidelines:**
- Consistent placeholder text styling
- Auto-resize для multi-line inputs
- Clear validation error messaging