# Epic 2: Interaction & Social Features

**Goal**: Transform the basic posting platform into an interactive social network by implementing the core engagement features: reactions, comments, and user profiles. This epic delivers the essential social interaction patterns that make the platform engaging and validates the social networking concept through meaningful user-to-content relationships.

### Story 2.1: Heart Reaction System

As a **user**,
I want **to react to posts with a single-click heart button that provides immediate visual feedback**,
so that **I can express appreciation for content and engage with other users' posts**.

#### Acceptance Criteria

1. Heart icon button displayed on each post with current reaction count
2. Single-click toggles heart state with immediate visual feedback (filled/outline)
3. Reaction count updates instantly without page refresh
4. Visual animation on heart click for satisfying user interaction
5. Reaction state persists across browser sessions
6. Prevention of multiple rapid clicks through debouncing
7. Heart button meets accessibility standards with keyboard navigation
8. Reaction data integrates with existing JSON storage system

### Story 2.2: Comment System

As a **user**,
I want **to add text comments to posts and view existing comments inline**,
so that **I can engage in conversations and discussions about shared content**.

#### Acceptance Criteria

1. Comment input field appears below each post with "Add comment" placeholder
2. Submit button or Enter key publishes comment immediately
3. Comments display in chronological order under their parent post
4. Each comment shows author name and timestamp
5. Comment character limit of 140 characters with counter
6. Comments persist in JSON storage linked to parent post
7. Empty state message for posts without comments
8. Comment input clears after successful submission

### Story 2.3: User Profile System

As a **user**,
I want **to view and manage my personal profile with my posted content**,
so that **I can see my contribution to the platform and manage my posts**.

#### Acceptance Criteria

1. Profile page accessible via main navigation showing user's posts only
2. User can set and edit display name for their posts
3. Profile shows total post count and join date
4. User's posts displayed in reverse chronological order on profile
5. Basic profile editing interface for name and bio (optional field)
6. Profile data persists in JSON storage with user identifier
7. Navigation between main feed and profile maintains app state
8. Profile page responsive across desktop and mobile viewports

### Story 2.4: Enhanced Post Management

As a **user**,
I want **to edit and delete my own posts from my profile page**,
so that **I have control over my content and can fix mistakes or remove unwanted posts**.

#### Acceptance Criteria

1. Edit and delete buttons visible only on user's own posts in profile view
2. Edit functionality opens post in editable state with save/cancel options
3. Delete functionality shows confirmation dialog before permanent removal
4. Post modifications update immediately in both profile and main feed
5. Edit history tracked with "last modified" timestamp
6. Deleted posts removed from all views and JSON storage
7. Post management actions provide clear success/error feedback
8. Changes to posts update reaction and comment associations correctly