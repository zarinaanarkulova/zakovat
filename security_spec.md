# Security Specification for Zakovat App

## Data Invariants
1. A question must have text, a media type, an answer, and a country name.
2. Admins are the only ones who can write (create, update, delete) questions.
3. Anyone (authenticated) can read questions to play the game.
4. Game settings/scores can only be updated by admins.

## The "Dirty Dozen" Payloads (Examples to catch)
1. Someone trying to delete a question without being an admin.
2. Someone trying to update a question text without being an admin.
3. Someone trying to set `order` to a string instead of an integer.
4. Someone trying to inject a very long string (>100kb) into the `text` field.
5. Someone trying to create a question without an `answer` field.

## Firestore Rules DRAFT
I will implement rules that check for `isAdmin()` and use `isValidQuestion()` helper.

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Default deny
    match /{document=**} {
      allow read, write: if false;
    }

    function isSignedIn() {
      return request.auth != null;
    }

    function isAdmin() {
      // In this specific app, we might want to check for a specific email or a dedicated admin collection
      // For now, let's assume existence in /admins/uid
      return isSignedIn() && exists(/databases/$(database)/documents/admins/$(request.auth.uid));
    }

    function isValidId(id) {
      return id is string && id.size() <= 128 && id.matches('^[a-zA-Z0-9_\\-]+$');
    }

    function isValidQuestion(data) {
      return data.keys().hasAll(['text', 'mediaType', 'answer', 'countryName'])
             && data.text is string && data.text.size() <= 5000
             && data.mediaType in ['text', 'image', 'video']
             && data.answer is string && data.answer.size() <= 1000
             && data.countryName is string && data.countryName.size() <= 100
             && (data.get('mediaUrl', '') == '' || (data.mediaUrl is string && data.mediaUrl.size() <= 1000))
             && (data.get('countryFlag', '') == '' || (data.countryFlag is string && data.countryFlag.size() <= 100))
             && (data.get('order', 0) is int);
    }

    match /questions/{questionId} {
      allow read: if isSignedIn();
      allow create: if isAdmin() && isValidQuestion(request.resource.data) && isValidId(questionId);
      allow update: if isAdmin() && isValidQuestion(request.resource.data);
      allow delete: if isAdmin();
    }

    match /settings/gameConfig {
      allow read: if isSignedIn();
      allow write: if isAdmin();
    }
    
    // Admin list - only manageable by someone who is already an admin OR the first setup.
    // For AI Studio, we can bootstrap the user's email.
    match /admins/{userId} {
      allow read: if isSignedIn() && request.auth.uid == userId;
      allow write: if false; // Only manageable via console or initial bootstrap
    }
  }
}
```
