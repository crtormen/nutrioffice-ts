# Frontend Implementation Plan - Invitation System

## 📊 Current State Analysis

### Existing Structure ✅
- **Settings Page:** Already exists at `src/pages/user/SettingsPage.tsx`
- **Pattern:** Uses sidebar navigation with Routes for tabs
- **Current Tabs:** Serviços, Anamnese, Avaliação, Aparência
- **State Management:** RTK Query with firestoreApi
- **UI Components:** shadcn/ui (Tabs, Dialogs, Forms)
- **Routing:** Already configured at `/user/settings/*`

### What We Need to Add
1. **Personal Data Tab** (Dados Pessoais)
2. **Collaborators Tab** (Colaboradores - PROFESSIONAL only)
3. **Accept Invitation Page** (public route)
4. **RTK Query Slices** for invitations and contributors
5. **UI Components** for invitation management

---

## 🎯 Implementation Plan

### Phase 1: RTK Query Slices & Services (2-3 hours)

#### 1.1 Create Invitation Service
**File:** `src/app/services/InvitationService.ts`

```typescript
// HTTP service for invitation API calls
// Uses fetch or axios to call Cloud Functions
// Handles authentication headers
```

**Methods needed:**
- `sendInvitation(uid, data)` - POST /users/:uid/invitations
- `getInvitations(uid, status?)` - GET /users/:uid/invitations
- `getInvitationByToken(token)` - GET /invitations/:token
- `acceptInvitation(token, userId)` - POST /invitations/:token/accept
- `revokeInvitation(uid, invitationId)` - DELETE /users/:uid/invitations/:id
- `resendInvitation(uid, invitationId)` - POST /users/:uid/invitations/:id/resend

#### 1.2 Create Contributors Service
**File:** `src/app/services/ContributorsService.ts`

```typescript
// Firestore service for contributors subcollection
// Similar pattern to CustomersService
```

**Methods needed:**
- `getAll(uid, callback)` - Real-time listener
- `getAllOnce(uid)` - One-time fetch
- `getById(uid, contributorId)` - Get one contributor
- `update(uid, contributorId, data)` - Update contributor
- `delete(uid, contributorId)` - Remove contributor

#### 1.3 Create Invitations Slice
**File:** `src/app/state/features/invitationsSlice.ts`

```typescript
export const invitationsSlice = firestoreApi.injectEndpoints({
  endpoints: (builder) => ({
    // Send invitation (mutation)
    sendInvitation: builder.mutation({
      invalidatesTags: ['Invitations'],
      // Call InvitationService.sendInvitation
    }),

    // Fetch invitations (query)
    fetchInvitations: builder.query({
      providesTags: ['Invitations'],
      // Call InvitationService.getInvitations
    }),

    // Get invitation by token (query) - public
    fetchInvitationByToken: builder.query({
      // No tags, public endpoint
    }),

    // Accept invitation (mutation)
    acceptInvitation: builder.mutation({
      // Call InvitationService.acceptInvitation
    }),

    // Revoke invitation (mutation)
    revokeInvitation: builder.mutation({
      invalidatesTags: ['Invitations'],
    }),

    // Resend invitation (mutation)
    resendInvitation: builder.mutation({
      // Don't invalidate, just send email
    }),
  }),
});
```

#### 1.4 Create Contributors Slice
**File:** `src/app/state/features/contributorsSlice.ts`

```typescript
export const contributorsSlice = firestoreApi.injectEndpoints({
  endpoints: (builder) => ({
    // Fetch contributors (query with real-time)
    fetchContributors: builder.query({
      providesTags: ['Contributors'],
      onCacheEntryAdded: // Real-time listener pattern
    }),

    // Update contributor (mutation)
    updateContributor: builder.mutation({
      invalidatesTags: ['Contributors'],
    }),

    // Remove contributor (mutation)
    removeContributor: builder.mutation({
      invalidatesTags: ['Contributors', 'Invitations'],
    }),
  }),
});
```

**Estimated Time:** 2-3 hours

---

### Phase 2: Personal Data Tab (2-3 hours)

#### 2.1 Create Component
**File:** `src/pages/user/PersonalDataTab.tsx`

**Features:**
- Display mode (read-only)
- Edit mode (form)
- Toggle between modes
- Form validation with Zod
- Save to Firestore + Firebase Auth

**UI Structure:**
```tsx
<div className="space-y-6">
  <div>
    <h3>Dados Pessoais</h3>
    <p className="text-muted-foreground">
      Gerencie suas informações pessoais
    </p>
  </div>

  <Separator />

  {!isEditing ? (
    <DisplayMode data={user} onEdit={() => setIsEditing(true)} />
  ) : (
    <EditMode
      data={user}
      onSave={handleSave}
      onCancel={() => setIsEditing(false)}
    />
  )}
</div>
```

**Form Fields:**
- Name (text)
- Email (read-only, from auth)
- Phone (text with mask)
- Save/Cancel buttons

**State Management:**
- Use `useFetchUserQuery(uid)` from userSlice
- Use `useUpdateUserMutation()` to save

#### 2.2 Add to SettingsPage
Update `sidebarNavItems` array:
```typescript
{
  title: "Dados Pessoais",
  link: "personal",
},
```

Add route:
```tsx
<Route path="personal" element={<PersonalDataTab />} />
```

**Estimated Time:** 2-3 hours

---

### Phase 3: Collaborators Tab - UI Components (3-4 hours)

#### 3.1 Invite Collaborator Dialog
**File:** `src/components/Settings/InviteCollaboratorDialog.tsx`

**Features:**
- Email input with validation
- Role selector (dropdown)
- Permissions checkboxes (future, optional for now)
- Send button
- Loading state
- Success/error toasts

**UI:**
```tsx
<Dialog>
  <DialogTrigger asChild>
    <Button>
      <UserPlus className="mr-2 h-4 w-4" />
      Convidar Colaborador
    </Button>
  </DialogTrigger>

  <DialogContent>
    <Form>
      <FormField name="email" />
      <FormField name="role">
        <Select>
          <SelectItem value="COLLABORATOR">Colaborador</SelectItem>
          <SelectItem value="SECRETARY">Secretária</SelectItem>
          <SelectItem value="MARKETING">Marketing</SelectItem>
          <SelectItem value="FINANCES">Financeiro</SelectItem>
        </Select>
      </FormField>

      {/* Future: Permissions */}

      <DialogFooter>
        <Button type="submit">Enviar Convite</Button>
      </DialogFooter>
    </Form>
  </DialogContent>
</Dialog>
```

**Validation Schema:**
```typescript
const inviteSchema = z.object({
  email: z.string().email("Email inválido"),
  role: z.enum(["COLLABORATOR", "SECRETARY", "MARKETING", "FINANCES", "ADMIN"]),
  permissions: z.array(z.string()).optional(),
});
```

#### 3.2 Collaborator Card
**File:** `src/components/Settings/CollaboratorCard.tsx`

**Features:**
- Display: name, email, role
- Status badge
- Actions dropdown (Edit role, Remove)
- Confirmation dialog for removal

**UI:**
```tsx
<Card>
  <CardHeader>
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Avatar>
          <AvatarFallback>{name[0]}</AvatarFallback>
        </Avatar>
        <div>
          <CardTitle>{name}</CardTitle>
          <CardDescription>{email}</CardDescription>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Badge>{ABILITIES[role].text}</Badge>
        <DropdownMenu>
          <DropdownMenuItem onClick={onEdit}>Editar</DropdownMenuItem>
          <DropdownMenuItem onClick={onRemove}>Remover</DropdownMenuItem>
        </DropdownMenu>
      </div>
    </div>
  </CardHeader>
</Card>
```

#### 3.3 Pending Invitation Card
**File:** `src/components/Settings/PendingInvitationCard.tsx`

**Features:**
- Display: email, role, sent date, expires date
- Status badge (Pending, Expired)
- Actions: Resend, Revoke
- Confirmation dialogs

**UI:**
```tsx
<Card>
  <CardHeader>
    <div className="flex items-center justify-between">
      <div>
        <CardTitle>{email}</CardTitle>
        <CardDescription>
          Enviado em {formatDate(createdAt)} •
          Expira em {formatDate(expiresAt)}
        </CardDescription>
      </div>

      <div className="flex items-center gap-2">
        <Badge variant="secondary">Pendente</Badge>
        <Button size="sm" onClick={onResend}>
          <Mail className="mr-2 h-4 w-4" />
          Reenviar
        </Button>
        <Button size="sm" variant="destructive" onClick={onRevoke}>
          <X className="mr-2 h-4 w-4" />
          Revogar
        </Button>
      </div>
    </div>
  </CardHeader>
</Card>
```

**Estimated Time:** 3-4 hours

---

### Phase 4: Collaborators Tab - Main Page (2-3 hours)

#### 4.1 Create Tab Component
**File:** `src/pages/user/CollaboratorsTab.tsx`

**Structure:**
```tsx
<div className="space-y-6">
  {/* Header */}
  <div className="flex items-center justify-between">
    <div>
      <h3>Colaboradores</h3>
      <p className="text-muted-foreground">
        Gerencie sua equipe e convites pendentes
      </p>
    </div>

    <InviteCollaboratorDialog />
  </div>

  <Separator />

  {/* Collaborator Limit */}
  <Alert>
    <InfoIcon className="h-4 w-4" />
    <AlertTitle>Limite de Colaboradores</AlertTitle>
    <AlertDescription>
      Você tem {contributors.length}/5 colaboradores ativos
    </AlertDescription>
  </Alert>

  {/* Active Collaborators Section */}
  <div className="space-y-4">
    <h4>Colaboradores Ativos ({contributors.length})</h4>
    {contributors.length === 0 ? (
      <EmptyState
        icon={Users}
        title="Nenhum colaborador"
        description="Convide membros para sua equipe"
      />
    ) : (
      contributors.map(c => (
        <CollaboratorCard key={c.id} {...c} />
      ))
    )}
  </div>

  <Separator />

  {/* Pending Invitations Section */}
  <div className="space-y-4">
    <h4>Convites Pendentes ({pendingInvitations.length})</h4>
    {pendingInvitations.length === 0 ? (
      <EmptyState
        icon={Mail}
        title="Nenhum convite pendente"
      />
    ) : (
      pendingInvitations.map(inv => (
        <PendingInvitationCard key={inv.id} {...inv} />
      ))
    )}
  </div>
</div>
```

**State Management:**
```typescript
const { dbUid, user } = useAuth();
const isProfessional = user?.roles?.ability === "PROFESSIONAL";

// Only fetch if professional
const { data: contributors } = useFetchContributorsQuery(dbUid, {
  skip: !isProfessional,
});

const { data: invitations } = useFetchInvitationsQuery(dbUid, {
  skip: !isProfessional,
});

const pendingInvitations = invitations?.filter(i => i.status === "pending");
```

#### 4.2 Add to SettingsPage
Update sidebar (conditionally for PROFESSIONAL):
```typescript
const sidebarNavItems = [
  { title: "Dados Pessoais", link: "personal" },
  // Existing items...
  ...(isProfessional ? [{
    title: "Colaboradores",
    link: "collaborators"
  }] : []),
];
```

Add route:
```tsx
<Route path="collaborators" element={<CollaboratorsTab />} />
```

**Estimated Time:** 2-3 hours

---

### Phase 5: Accept Invitation Page (3-4 hours)

#### 5.1 Create Page
**File:** `src/pages/auth/AcceptInvitationPage.tsx`

**Flow:**
1. Extract token from URL query params
2. Fetch invitation details
3. Show invitation info
4. Registration form
5. Create user + accept invitation
6. Redirect to login

**UI Structure:**
```tsx
<div className="container max-w-lg mx-auto py-10">
  {loading && <LoadingSpinner />}

  {error && (
    <Alert variant="destructive">
      <AlertTitle>Convite Inválido</AlertTitle>
      <AlertDescription>{error.message}</AlertDescription>
    </Alert>
  )}

  {invitation && (
    <>
      {/* Invitation Details Card */}
      <Card>
        <CardHeader>
          <CardTitle>Convite para Colaboração</CardTitle>
          <CardDescription>
            {invitation.professionalName} convidou você para
            colaborar como {ABILITIES[invitation.role].text}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="space-y-2">
            <div>
              <dt>Email:</dt>
              <dd>{invitation.email}</dd>
            </div>
            <div>
              <dt>Função:</dt>
              <dd>{ABILITIES[invitation.role].text}</dd>
            </div>
            <div>
              <dt>Válido até:</dt>
              <dd>{formatDate(invitation.expiresAt)}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Separator />

      {/* Registration Form */}
      <Card>
        <CardHeader>
          <CardTitle>Complete seu Cadastro</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <FormField name="email" disabled value={invitation.email} />
            <FormField name="name" />
            <FormField name="phone" />
            <FormField name="password" type="password" />
            <FormField name="confirmPassword" type="password" />

            <Button type="submit">Aceitar Convite</Button>
          </Form>
        </CardContent>
      </Card>
    </>
  )}
</div>
```

**Validation Schema:**
```typescript
const acceptInvitationSchema = z.object({
  email: z.string().email(),
  name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  phone: z.string().regex(/^\(\d{2}\) \d{5}-\d{4}$/, "Telefone inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Senhas não conferem",
  path: ["confirmPassword"],
});
```

**Submit Handler:**
```typescript
const onSubmit = async (data) => {
  try {
    // 1. Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      data.email,
      data.password
    );

    // 2. Create Firestore user document
    await setDoc(doc(db, "users", userCredential.user.uid), {
      name: data.name,
      email: data.email,
      phone: data.phone,
      roles: { ability: invitation.role },
      contributesTo: invitation.professionalId,
      createdAt: serverTimestamp(),
    });

    // 3. Accept invitation (API call)
    await acceptInvitation({
      token,
      userId: userCredential.user.uid,
    }).unwrap();

    // 4. Sign out (they need to login)
    await signOut(auth);

    // 5. Redirect to login with success message
    navigate("/login", {
      state: {
        message: "Conta criada com sucesso! Faça login para continuar."
      }
    });

  } catch (error) {
    toast({
      variant: "destructive",
      title: "Erro ao aceitar convite",
      description: error.message,
    });
  }
};
```

#### 5.2 Add Public Route
**File:** `src/app/router/AppRouter.tsx`

Add to public routes (NotAuthLayout):
```tsx
<Route path="accept-invitation" element={<AcceptInvitationPage />} />
```

Update routes.ts:
```typescript
ACCEPT_INVITATION: "/accept-invitation",
```

**Estimated Time:** 3-4 hours

---

### Phase 6: Testing & Polish (2-3 hours)

#### 6.1 Manual Testing
- [ ] Send invitation as PROFESSIONAL
- [ ] Receive email
- [ ] Click email link
- [ ] Complete registration
- [ ] Verify contributor added
- [ ] Login as collaborator
- [ ] Verify access to professional's data
- [ ] Test resend invitation
- [ ] Test revoke invitation
- [ ] Test remove collaborator
- [ ] Test collaborator limit

#### 6.2 Error Scenarios
- [ ] Invalid token
- [ ] Expired invitation
- [ ] Duplicate email
- [ ] Non-professional trying to invite
- [ ] Collaborator limit exceeded
- [ ] Network errors
- [ ] Form validation errors

#### 6.3 UI/UX Polish
- [ ] Loading states
- [ ] Empty states
- [ ] Error messages
- [ ] Success toasts
- [ ] Responsive design
- [ ] Accessibility (ARIA labels)
- [ ] Dark mode support

**Estimated Time:** 2-3 hours

---

## 📁 File Structure

```
src/
├── app/
│   ├── services/
│   │   ├── InvitationService.ts          ✨ NEW
│   │   └── ContributorsService.ts        ✨ NEW
│   └── state/
│       └── features/
│           ├── invitationsSlice.ts       ✨ NEW
│           └── contributorsSlice.ts      ✨ NEW
│
├── components/
│   └── Settings/
│       ├── InviteCollaboratorDialog.tsx  ✨ NEW
│       ├── CollaboratorCard.tsx          ✨ NEW
│       └── PendingInvitationCard.tsx     ✨ NEW
│
└── pages/
    ├── user/
    │   ├── SettingsPage.tsx              🔧 MODIFY
    │   ├── PersonalDataTab.tsx           ✨ NEW
    │   └── CollaboratorsTab.tsx          ✨ NEW
    └── auth/
        └── AcceptInvitationPage.tsx      ✨ NEW
```

---

## 🎨 UI Components Needed

### From shadcn/ui (install if missing):
```bash
npx shadcn@latest add dialog
npx shadcn@latest add select
npx shadcn@latest add avatar
npx shadcn@latest add alert
npx shadcn@latest add badge
# Others already installed
```

### Icons from lucide-react:
- UserPlus (invite button)
- Mail (resend)
- X (revoke/remove)
- Users (collaborators)
- InfoIcon (alerts)
- Edit, Trash2 (actions)

---

## ⏱️ Time Estimates

| Phase | Description | Time |
|-------|-------------|------|
| 1 | RTK Query Slices & Services | 2-3h |
| 2 | Personal Data Tab | 2-3h |
| 3 | Collaborators UI Components | 3-4h |
| 4 | Collaborators Tab Main | 2-3h |
| 5 | Accept Invitation Page | 3-4h |
| 6 | Testing & Polish | 2-3h |
| **Total** | | **14-20h** |

---

## 🚀 Implementation Order

### Day 1 (6-8 hours)
1. **Phase 1:** Create services and slices (foundation)
2. **Phase 2:** Build Personal Data Tab (simpler, standalone)

### Day 2 (6-8 hours)
3. **Phase 3:** Build UI components for collaborators
4. **Phase 4:** Assemble Collaborators Tab

### Day 3 (4-6 hours)
5. **Phase 5:** Build Accept Invitation Page
6. **Phase 6:** Test everything end-to-end

---

## 🎯 Key Decisions

### 1. HTTP vs Firestore for Invitations?
**Decision:** Use HTTP (Cloud Functions API)
**Reason:** Invitations need complex validation, email sending, token generation - better suited for backend

### 2. Real-time vs One-time for Contributors?
**Decision:** Real-time subscription (like customers)
**Reason:** Consistent with app patterns, better UX

### 3. Tabs vs Modal for Invite?
**Decision:** Dialog/Modal
**Reason:** Follows existing Settings patterns (like SetServiceDialog)

### 4. Inline Edit vs Separate Page for Personal Data?
**Decision:** Inline toggle (display/edit mode)
**Reason:** Simple enough for inline, better UX

---

## 🔒 Security Considerations

- ✅ Check PROFESSIONAL role before showing Collaborators tab
- ✅ Validate on frontend AND backend (don't trust client)
- ✅ Handle auth errors gracefully
- ✅ Don't expose sensitive data in error messages
- ✅ Verify token before showing registration form
- ✅ Sign out after registration (force login)
- ✅ Rate limit on backend (already implemented)

---

## 📝 Notes

- **Existing patterns:** Follow SettingsPage structure (sidebar navigation)
- **State management:** Use RTK Query like other features
- **Form validation:** Zod schemas like existing forms
- **UI components:** shadcn/ui consistent with app
- **Error handling:** Toast notifications
- **Loading states:** Skeleton or spinner
- **Empty states:** Friendly messages with icons

---

## ✅ Success Criteria

- [ ] PROFESSIONAL can invite collaborators via email
- [ ] Invited users receive professional HTML emails
- [ ] Recipients can register using invitation link
- [ ] Collaborators appear in active list
- [ ] Pending invitations shown with actions
- [ ] Can resend/revoke invitations
- [ ] Can remove collaborators
- [ ] 5 collaborator limit enforced
- [ ] Personal data editable
- [ ] All error cases handled
- [ ] UI responsive and accessible
- [ ] Dark mode working
- [ ] Works with backend API
- [ ] Custom claims updated correctly

---

## 🆘 Troubleshooting Tips

**API calls failing?**
- Check Firebase Functions emulator running
- Verify auth token in headers
- Check CORS configuration
- Review function logs

**Real-time not updating?**
- Verify Firestore listeners attached
- Check RTK Query tag invalidation
- Test manual refetch

**Styling issues?**
- Check Tailwind classes
- Verify dark mode classes
- Test responsive breakpoints

**Form validation not working?**
- Console.log form errors
- Check Zod schema
- Verify react-hook-form setup

---

Ready to start implementing? 🚀

**Recommended first step:** Phase 1 (Services & Slices) - this is the foundation everything else builds on.
