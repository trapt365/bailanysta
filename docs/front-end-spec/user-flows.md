# User Flows

### Post Creation Flow

**User Goal:** Быстро создать и опубликовать текстовый пост с опциональным настроением

**Entry Points:** 
- Кнопка "+" в главной навигации
- Floating Action Button на мобильных
- Empty state message в ленте

**Success Criteria:** Пост опубликован и появляется в ленте с корректным timestamp

#### Flow Diagram

```mermaid
graph TD
    A[Click Create Post] --> B[Post Creation Modal Opens]
    B --> C[Enter Text Content]
    C --> D{Character Count Valid?}
    D -->|No| E[Show Warning, Disable Publish]
    D -->|Yes| F[Optional: Select Mood]
    F --> G[Click Publish]
    G --> H[Loading State]
    H --> I{Publish Success?}
    I -->|Yes| J[Success Message + Close Modal]
    I -->|No| K[Error Message + Retry Option]
    J --> L[Post Appears in Feed]
    E --> C
    K --> G
```

#### Edge Cases & Error Handling:
- Пустой пост: блокировка кнопки публикации с подсказкой
- Превышение лимита символов: real-time подсчет с визуальным предупреждением
- Ошибка сохранения: retry механизм с сохранением введенного текста
- Потеря интернет-соединения: draft автосохранение в localStorage

**Notes:** Mood selection - уникальная фича Bailanysta для эмоционального контекста постов

### Reaction Flow

**User Goal:** Выразить appreciation к посту одним кликом

**Entry Points:** Heart icon на любом посту в ленте или профиле

**Success Criteria:** Реакция зарегистрирована с мгновенным visual feedback

#### Flow Diagram

```mermaid
graph TD
    A[Click Heart Icon] --> B[Immediate Visual Feedback]
    B --> C{Already Liked?}
    C -->|No| D[Heart Fills + Count Increments]
    C -->|Yes| E[Heart Empties + Count Decrements]
    D --> F[Save to Storage]
    E --> F
    F --> G{Save Success?}
    G -->|Yes| H[State Persisted]
    G -->|No| I[Revert Visual State + Show Error]
```

#### Edge Cases & Error Handling:
- Rapid clicking: debouncing для предотвращения множественных запросов
- Network error: optimistic UI с rollback при ошибке
- Storage full: graceful degradation с уведомлением пользователя

**Notes:** Анимация сердечка должна быть satisfying но не отвлекающая (~200ms duration)

### Comment Flow

**User Goal:** Добавить комментарий к посту для начала диалога

**Entry Points:** Comment icon или поле "Add comment" под постом

**Success Criteria:** Комментарий сохранен и отображается под постом

#### Flow Diagram

```mermaid
graph TD
    A[Click Comment Area] --> B[Input Field Expands]
    B --> C[Type Comment]
    C --> D{Character Count Valid?}
    D -->|No| E[Show Character Limit Warning]
    D -->|Yes| F[Enter Key or Submit Button]
    F --> G[Loading Indicator]
    G --> H{Submit Success?}
    H -->|Yes| I[Comment Appears Below Post]
    H -->|No| J[Error Message + Retry]
    I --> K[Input Field Clears]
    E --> C
    J --> F
```

#### Edge Cases & Error Handling:
- Пустой комментарий: disabled submit button
- Превышение лимита: real-time counter с визуальным предупреждением
- Ошибка отправки: сохранение текста + retry опция
- Спам prevention: простой rate limiting (1 комментарий в 5 секунд)

### Profile Management Flow

**User Goal:** Просмотреть и редактировать свои посты, обновить профильную информацию

**Entry Points:** Profile icon в главной навигации

**Success Criteria:** Изменения сохранены и отражены во всех views

#### Flow Diagram

```mermaid
graph TD
    A[Navigate to Profile] --> B[Load User Posts]
    B --> C[Display Profile Info + Posts]
    C --> D[Select Action]
    D --> E[Edit Profile Info]
    D --> F[Edit Post]
    D --> G[Delete Post]
    E --> H[Update Profile Form]
    F --> I[Edit Post Modal]
    G --> J[Confirmation Dialog]
    H --> K[Save Changes]
    I --> K
    J --> L{Confirm Delete?}
    L -->|Yes| M[Delete Post]
    L -->|No| C
    K --> N{Save Success?}
    M --> N
    N -->|Yes| O[Update UI + Success Message]
    N -->|No| P[Error Message + Retry]
```

#### Edge Cases & Error Handling:
- Случайное удаление: обязательная confirmation dialog
- Потеря изменений: auto-save draft functionality
- Конфликт версий: simple last-write-wins с уведомлением
- Пустое имя пользователя: валидация с fallback на default name