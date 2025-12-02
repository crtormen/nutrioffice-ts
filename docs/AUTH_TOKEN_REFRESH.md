# Authentication Token Refresh

## Overview

Firebase automatically revokes authentication tokens when custom claims are updated. This document explains how token refresh is handled in NutriOffice.

## The Problem

When custom claims are updated (roles, permissions, `contributesTo` field), Firebase revokes the current authentication token for security reasons. This causes:

- API calls to fail with `auth/id-token-revoked` error
- User needs to log out and log back in to get a new token
- Poor user experience

## The Solution

### Global Token Refresh in AuthContext

Added a `refreshToken()` method to the AuthContext that:
1. Forces Firebase to refresh the current token with `user.getIdToken(true)`
2. Fetches updated custom claims with `user.getIdTokenResult()`
3. Updates the `dbUid` state with new claims
4. Logs success/error for debugging

**Implementation:** [authContext.tsx](../src/infra/firebase/context/authContext.tsx#L174-L192)

```typescript
const refreshToken = useCallback(async (): Promise<void> => {
  if (!user) {
    console.warn("Cannot refresh token: no user logged in");
    return;
  }

  try {
    // Force refresh the token and get new custom claims
    await user.getIdToken(true);
    const tokenResult = await user.getIdTokenResult();

    // Update dbUid with new custom claims
    setDbUid((tokenResult.claims.contributesTo as string) || user.uid);
    console.log("Token refreshed successfully");
  } catch (error) {
    console.error("Error refreshing token:", error);
    throw error;
  }
}, [user]);
```

### Usage in Components

Components can now use `refreshToken()` from the auth context whenever they perform operations that change custom claims:

**Example:** [PreferencesTab.tsx](../src/pages/user/PreferencesTab.tsx#L32-L44)

```typescript
const { refreshToken } = useAuth();

async function handleRedefineCustomClaims() {
  try {
    await redefineCustomClaims(); // Changes custom claims
    await refreshToken(); // Refresh token immediately
    toast.success("As Declarações de Usuário foram definidas e o token foi atualizado!");
  } catch (err) {
    toast.error("Erro ao redefinir Declarações de Usuário!");
  }
}
```

## When to Use refreshToken()

Call `refreshToken()` after any operation that modifies custom claims:

1. **Redefining custom claims** - When admin updates user roles/permissions
2. **Changing contributor status** - When modifying `contributesTo` field
3. **Role updates** - When promoting/demoting users
4. **Permission changes** - When updating access levels

## Benefits

✅ **No logout required** - Users stay logged in after claims update
✅ **Immediate effect** - New permissions apply instantly
✅ **Better UX** - Seamless experience without interruptions
✅ **Centralized logic** - Token refresh handled in one place
✅ **Error handling** - Proper logging and error propagation

## Error Handling

If token refresh fails:
- Error is logged to console
- Exception is thrown and can be caught by caller
- User can retry the operation
- As fallback, user can log out and log back in

## Technical Details

### Token Lifecycle

1. User logs in → Gets initial token with custom claims
2. Admin changes custom claims → Firebase revokes old token
3. App calls `refreshToken()` → Gets new token with updated claims
4. All subsequent API calls use the new token

### Custom Claims Structure

```typescript
{
  uid: string;                    // User's unique ID
  role: Abilities;                // PROFESSIONAL, COLLABORATOR, etc.
  contributesTo?: string;         // Professional ID if contributor
}
```

### dbUid Logic

The `dbUid` determines which user's data to query:
- **Professional:** `dbUid = user.uid` (own data)
- **Collaborator:** `dbUid = contributesTo` (professional's data)

This is updated when token is refreshed to ensure correct data access.

## Future Improvements

1. **Automatic refresh** - Listen for token expiration and refresh automatically
2. **Retry logic** - Automatically retry failed API calls after token refresh
3. **Token refresh UI** - Show loading indicator during token refresh
4. **Broadcast refresh** - Notify all open tabs to refresh tokens

---

**Related Documentation:**
- [PERMISSIONS_GUIDE.md](PERMISSIONS_GUIDE.md) - Permissions system
- [INVITATION_SYSTEM.md](INVITATION_SYSTEM.md) - User invitation flow
- [CLAUDE.md](../CLAUDE.md) - Custom claims architecture

**Last Updated:** November 25, 2025
