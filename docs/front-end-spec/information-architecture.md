# Information Architecture (IA)

### Site Map / Screen Inventory

```mermaid
graph TD
    A[Main Feed] --> B[Post Creation Modal]
    A --> C[User Profile]
    A --> D[Settings]
    A --> E[Search Results]
    C --> F[Edit Profile]
    C --> G[My Posts Management]
    G --> H[Edit Post Modal]
    A --> I[Hashtag Feed]
    D --> J[Theme Toggle]
    B --> K[Mood Selection]
```

### Navigation Structure

**Primary Navigation:** 
- Main Feed (Home icon) - центральная лента всех постов
- Profile (User icon) - личный профиль и управление постами  
- Create Post (Plus icon) - быстрое создание нового поста
- Settings (Gear icon) - настройки темы и предпочтений

**Secondary Navigation:** 
- Search bar в верхней части для поиска по постам и хештегам
- Theme toggle в настройках
- Hashtag links внутри постов для фильтрации контента

**Breadcrumb Strategy:** 
Минималистичная навигация без breadcrumbs, так как архитектура плоская. Используется четкий visual hierarchy и кнопка "Back" где необходимо.