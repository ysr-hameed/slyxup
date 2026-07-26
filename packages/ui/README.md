# @slyxup/ui

Shared React component library for Slyxup products. Built with Tailwind CSS v4.

## Installation

```bash
npm install @slyxup/ui
```

Requires `react`, `react-dom`, and `tailwindcss` as peer dependencies.

## Components

### Button

```tsx
import { Button } from "@slyxup/ui";

<Button variant="primary" size="md" onClick={handleClick}>
  Save
</Button>
<Button variant="secondary" loading>Loading...</Button>
<Button variant="outline">Cancel</Button>
<Button variant="danger">Delete</Button>
```

| Prop       | Type                                       | Default      |
|------------|--------------------------------------------|--------------|
| `variant`  | `"primary" \| "secondary" \| "outline" \| "danger"` | `"primary"` |
| `size`     | `"sm" \| "md" \| "lg"`                     | `"md"`       |
| `disabled` | `boolean`                                  | —            |
| `loading`  | `boolean`                                  | —            |
| `onClick`  | `() => void`                               | —            |
| `type`     | `"button" \| "submit"`                     | `"button"`   |

### Input

```tsx
import { Input } from "@slyxup/ui";

<Input label="Email" type="email" placeholder="user@example.com" required />
<Input label="Password" type="password" error="Must be at least 8 characters" />
```

| Prop          | Type       | Default  |
|---------------|-----------|----------|
| `label`       | `string`  | —        |
| `error`       | `string`  | —        |
| `type`        | `string`  | `"text"` |
| `placeholder` | `string`  | —        |
| `value`       | `string`  | —        |
| `onChange`    | `(e) => void` | —     |
| `required`    | `boolean` | —        |

### Card

```tsx
import { Card } from "@slyxup/ui";

<Card title="Profile" subtitle="Manage your account info">
  <p>Content here</p>
</Card>
```

| Prop       | Type       | Description |
|------------|-----------|-------------|
| `title`    | `string`  | Card heading |
| `subtitle` | `string`  | Subtitle under heading |
| `className`| `string`  | Additional CSS classes |

### Badge

```tsx
import { Badge } from "@slyxup/ui";

<Badge variant="success">Active</Badge>
<Badge variant="warning">Pending</Badge>
<Badge variant="error">Expired</Badge>
<Badge variant="info">New</Badge>
<Badge>Default</Badge>
```

| Prop      | Type                                                    | Default     |
|-----------|---------------------------------------------------------|-------------|
| `variant` | `"success" \| "warning" \| "error" \| "info" \| "default"` | `"default"` |

### Navbar

```tsx
import { Navbar } from "@slyxup/ui";

<Navbar
  brand="My App"
  items={[
    { label: "Dashboard", href: "/dashboard" },
    { label: "Settings", href: "/settings" },
  ]}
  user={{ name: "Jane Doe", email: "jane@example.com" }}
  onLogout={() => console.log("logout")}
/>
```

| Prop       | Type                                    | Description |
|------------|-----------------------------------------|-------------|
| `brand`    | `string`                                | App name/logo |
| `items`    | `{ label, href }[]`                     | Navigation links |
| `user`     | `{ name, email } \| null`              | Current user |
| `onLogout` | `() => void`                            | Logout handler |

### AuthGuard

```tsx
import { AuthGuard } from "@slyxup/ui";

<AuthGuard isAuthenticated={!!user}>
  <Dashboard />
</AuthGuard>

<AuthGuard
  isAuthenticated={false}
  fallback={<LoginPage />}
>
  <ProtectedContent />
</AuthGuard>
```

| Prop             | Type        | Default |
|------------------|------------|---------|
| `isAuthenticated`| `boolean`  | —       |
| `fallback`       | `ReactNode`| Default "Access Denied" screen |

## Styling

All components use Tailwind CSS classes. Your project must have Tailwind CSS v4 configured with the JIT engine. No additional CSS imports are required.
