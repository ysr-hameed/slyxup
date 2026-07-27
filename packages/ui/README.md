# @slyxup/ui

Shared React component library for Slyxup products. Built with Tailwind CSS v4. No external UI framework — all components are custom.

## Installation

```bash
npm install @slyxup/ui
```

Peer dependencies: `react`, `react-dom`, `tailwindcss` v4 (JIT engine). Your project must have Tailwind CSS v4 configured.

## Components

### Button

Six variants, three sizes, loading spinner, and disabled state.

```tsx
import { Button } from "@slyxup/ui";

<Button variant="primary" size="lg" onClick={handleSubmit}>
  Save
</Button>
<Button variant="secondary" size="sm" loading>Loading...</Button>
<Button variant="outline">Cancel</Button>
<Button variant="danger" disabled>Delete</Button>
<Button type="submit">Submit Form</Button>
```

| Prop | Type | Default |
|------|------|---------|
| `variant` | `"primary"` \| `"secondary"` \| `"outline"` \| `"danger"` | `"primary"` |
| `size` | `"sm"` \| `"md"` \| `"lg"` | `"md"` |
| `disabled` | `boolean` | — |
| `loading` | `boolean` | — |
| `onClick` | `() => void` | — |
| `type` | `"button"` \| `"submit"` | `"button"` |
| `className` | `string` | — |

When `loading` is true, a spinning indicator replaces the default cursor and the button is disabled.

### Input

Labeled input with error state.

```tsx
import { Input } from "@slyxup/ui";

<Input label="Email" type="email" placeholder="user@example.com" required />
<Input label="Password" type="password" error="Must be at least 8 characters" />
<Input value={name} onChange={handleChange} />
```

| Prop | Type | Default |
|------|------|---------|
| `label` | `string` | — |
| `error` | `string` | — |
| `type` | `string` | `"text"` |
| `placeholder` | `string` | — |
| `value` | `string` | — |
| `onChange` | `(e: ChangeEvent<HTMLInputElement>) => void` | — |
| `required` | `boolean` | — |
| `className` | `string` | — |

When `error` is set, the input border turns red and the error message appears below.

### Card

Container with optional header.

```tsx
import { Card } from "@slyxup/ui";

<Card title="Profile" subtitle="Manage your account info">
  <p>Your content here.</p>
</Card>

<Card>
  <p>Simple card without header.</p>
</Card>
```

| Prop | Type | Description |
|------|------|-------------|
| `title` | `string` | Card heading |
| `subtitle` | `string` | Subtitle below heading |
| `className` | `string` | Additional CSS classes |

### Badge

Small status indicator.

```tsx
import { Badge } from "@slyxup/ui";

<Badge variant="success">Active</Badge>
<Badge variant="warning">Pending</Badge>
<Badge variant="error">Expired</Badge>
<Badge variant="info">New</Badge>
<Badge>Default</Badge>   {/* variant defaults to "default" */}
```

| Prop | Type | Default |
|------|------|---------|
| `variant` | `"success"` \| `"warning"` \| `"error"` \| `"info"` \| `"default"` | `"default"` |

### Navbar

Top navigation bar with brand, links, and user menu.

```tsx
import { Navbar } from "@slyxup/ui";

<Navbar
  brand="My App"
  items={[
    { label: "Dashboard", href: "/dashboard" },
    { label: "Settings", href: "/settings" },
  ]}
  user={{ name: "Jane Doe", email: "jane@example.com" }}
  onLogout={() => auth.logout(jwt)}
/>
```

| Prop | Type | Description |
|------|------|-------------|
| `brand` | `string` | App name / logo text |
| `items` | `{ label: string; href: string }[]` | Navigation links |
| `user` | `{ name: string; email: string } \| null` | Current user |
| `onLogout` | `() => void` | Logout button handler |

When `user` is provided, the user's name/email is shown on the right with a logout button. When `user` is null/nullable, the user section is hidden.

### AuthGuard

Protects content behind authentication.

```tsx
import { AuthGuard } from "@slyxup/ui";

// Default "Access Denied" screen
<AuthGuard isAuthenticated={!!user}>
  <Dashboard />
</AuthGuard>

// Custom fallback
<AuthGuard
  isAuthenticated={false}
  fallback={<LoginPage />}
>
  <ProtectedContent />
</AuthGuard>
```

| Prop | Type | Default |
|------|------|---------|
| `isAuthenticated` | `boolean` | — |
| `fallback` | `ReactNode` | Centered "Access Denied" message |

## Styling

All components use Tailwind CSS classes directly. No CSS modules, CSS-in-JS, or external stylesheets. Your project needs Tailwind CSS v4 with JIT enabled. Components are designed with a neutral gray+blue palette.

## Full example

```tsx
import { Button, Input, Card, Badge, Navbar, AuthGuard } from "@slyxup/ui";

function ProfilePage({ user, onLogout }) {
  return (
    <AuthGuard isAuthenticated={!!user}>
      <Navbar
        brand="My App"
        items={[{ label: "Dashboard", href: "/dashboard" }]}
        user={user}
        onLogout={onLogout}
      />
      <div className="max-w-2xl mx-auto p-6">
        <Card title="Profile" subtitle="Manage your account">
          <div className="space-y-4">
            <Input label="Name" value={user.name} />
            <Input label="Email" value={user.email} type="email" />
            <Badge variant="success">Verified</Badge>
            <Button>Update Profile</Button>
          </div>
        </Card>
      </div>
    </AuthGuard>
  );
}
```
