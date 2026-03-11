# Admin Panel

This directory contains all admin-related pages and components for the EduMatch platform.

## 📁 Directory Structure

```
admin/
├── layout.tsx              # Main admin layout with sidebar
├── page.tsx               # Dashboard overview (default route)
├── users/
│   └── page.tsx          # User management page
├── scholarships/
│   └── page.tsx          # Scholarship management page
└── applications/
    └── page.tsx          # Application management page
```

## 🔐 Access Control

All routes under `/admin` are protected by middleware and require:
- Valid authentication token
- User role: `admin`

Unauthorized access will redirect to:
- Not logged in → `/auth/login`
- Wrong role → `/` (home page)

## 🎯 Pages Overview

### Dashboard (`/admin`)
Main overview page displaying:
- Key statistics (users, scholarships, applications, funding)
- Recent applications with status
- Recently registered users
- Activity chart placeholder

**Features:**
- Real-time statistics
- Color-coded status badges
- Quick navigation cards
- Responsive design

### User Management (`/admin/users`)
Comprehensive user administration:
- View all users (students, providers, admins)
- Search by name or email
- Filter by role and status
- Edit user details
- Send emails to users
- Delete users
- Pagination (10 per page)

**Features:**
- Advanced search and filters
- Role-based badges
- Quick actions (Edit, Email, Delete)
- User statistics panel

### Scholarship Management (`/admin/scholarships`)
Manage all scholarships:
- View all scholarships
- Search by title or provider
- Filter by status and type
- View scholarship details
- Edit scholarships
- Delete scholarships
- Pagination (8 per page)

**Features:**
- Card-based grid layout
- Status indicators with icons
- Applicant and approval tracking
- Multiple scholarship types

### Application Management (`/admin/applications`)
Review and process applications:
- View all applications
- Search by student, scholarship, or ID
- Filter by status
- Approve applications
- Reject applications
- Export reports
- Pagination (10 per page)

**Features:**
- Detailed application table
- GPA and document tracking
- Quick approve/reject actions
- Status-based filtering

## 🎨 Design System

### Layout Components
- **Sidebar**: Fixed left navigation with menu items
- **TopBar**: Search, notifications, user menu
- **Mobile Menu**: Hamburger toggle for mobile devices
- **Main Content**: Dynamic page content area

### Color Scheme
```typescript
// Role badges
admin: 'bg-purple-100 text-purple-700'
student: 'bg-blue-100 text-blue-700'
provider: 'bg-green-100 text-green-700'

// Status badges
active/approved: 'bg-green-100 text-green-700'
pending: 'bg-yellow-100 text-yellow-700'
under_review: 'bg-blue-100 text-blue-700'
rejected/expired: 'bg-red-100 text-red-700'
```

### Icons (Lucide React)
- Dashboard: `LayoutDashboard`
- Users: `Users`
- Scholarships: `GraduationCap`
- Applications: `FileText`
- Providers: `Briefcase`
- Analytics: `BarChart3`
- Settings: `Settings`

## 🔧 Technical Implementation

### State Management
- React hooks (`useState`, `useEffect`)
- Local state for search/filter
- Pagination state
- Mock data from `src/lib/mock-data.ts`

### Data Flow
```
Mock Data (mock-data.ts)
  ↓
Admin Page Components
  ↓
Search/Filter Logic
  ↓
Paginated Display
  ↓
User Actions
```

### Responsive Breakpoints
- Mobile: `< 768px` - Stacked layout, mobile menu
- Tablet: `768px - 1024px` - Adaptive grid
- Desktop: `> 1024px` - Full sidebar layout

## 📊 Mock Data

Current mock data includes:
- 8 users (4 students, 3 providers, 1 admin)
- 8 scholarships (5 active, 2 pending, 1 expired)
- 8 applications (various statuses)

Located in: `src/lib/mock-data.ts`

## 🚀 Usage

### Development
```bash
# Start dev server
npm run dev

# Login as admin
http://localhost:3000/auth/login
Email: admin@demo.com
Password: password

# Access admin panel
http://localhost:3000/admin
```

### Adding New Admin Pages

1. Create page file:
```typescript
// src/app/admin/new-page/page.tsx
'use client';

export default function NewAdminPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">New Page</h1>
      {/* Your content */}
    </div>
  );
}
```

2. Add to sidebar navigation in `layout.tsx`:
```typescript
{
  title: 'New Page',
  icon: YourIcon,
  href: '/admin/new-page',
  badge: null
}
```

3. Update Navbar.tsx if needed:
```typescript
<Link href="/admin/new-page">New Page</Link>
```

## 🎯 Best Practices

### Component Structure
```typescript
// Page component
export default function AdminPage() {
  // 1. State declarations
  const [data, setData] = useState([]);
  
  // 2. Computed values
  const filteredData = useMemo(() => {
    // filtering logic
  }, [data]);
  
  // 3. Event handlers
  const handleAction = () => {
    // action logic
  };
  
  // 4. JSX return
  return (
    <div className="space-y-6">
      {/* Header */}
      {/* Statistics */}
      {/* Filters */}
      {/* Content */}
      {/* Pagination */}
    </div>
  );
}
```

### Search Implementation
```typescript
const filteredItems = items.filter(item => {
  const matchesSearch = 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.email.toLowerCase().includes(searchQuery.toLowerCase());
  return matchesSearch;
});
```

### Pagination Pattern
```typescript
const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
const startIndex = (currentPage - 1) * itemsPerPage;
const paginatedItems = filteredItems.slice(
  startIndex, 
  startIndex + itemsPerPage
);
```

## 📚 Dependencies

### UI Components (shadcn/ui)
- `Card`, `CardContent`, `CardHeader`, `CardTitle`
- `Badge`
- `Button`
- `Input`

### Icons (Lucide React)
- Navigation icons
- Action icons
- Status icons

### Utilities
- `cn()` - Class name merger
- `usePathname()` - Next.js routing
- `Link` - Next.js navigation

## 🔜 Future Enhancements

### Planned Features
- [ ] Modal dialogs for editing
- [ ] Confirmation dialogs for deletions
- [ ] Toast notifications for actions
- [ ] Advanced analytics page
- [ ] Settings page
- [ ] Bulk actions
- [ ] CSV/PDF export
- [ ] Real-time updates
- [ ] Audit logs
- [ ] Role permissions management

### Integration TODO
- [ ] Replace mock data with API calls
- [ ] Implement real database queries
- [ ] Add form validation
- [ ] Error handling
- [ ] Loading states
- [ ] Optimistic UI updates

## 🐛 Known Issues

- Mock data is static (no persistence)
- Charts not implemented (placeholder only)
- Some actions are UI-only (no backend)
- Limited to small dataset (8-10 items)

## 📝 Documentation

Comprehensive documentation available:
- `ADMIN_LOGIN.md` - Login credentials and access
- `ADMIN_GUIDE.md` - Complete user guide
- `ADMIN_IMPLEMENTATION_SUMMARY.md` - Technical overview
- `ADMIN_README.md` - Quick start guide
- `ADMIN_CHANGELOG.md` - Version history
- `ADMIN_QUICK_REFERENCE.md` - Quick reference card

## 🤝 Contributing

When adding new admin features:
1. Follow existing code structure
2. Use consistent naming conventions
3. Add proper TypeScript types
4. Implement responsive design
5. Update documentation
6. Test on multiple screen sizes
7. Ensure accessibility

## 📞 Support

For questions or issues:
- Check existing documentation
- Review component code
- Check browser console for errors
- Test with admin credentials

---

**Admin Panel Version**: 1.0.0  
**Last Updated**: October 9, 2025  
**Status**: ✅ Production Ready (for development/demo)
