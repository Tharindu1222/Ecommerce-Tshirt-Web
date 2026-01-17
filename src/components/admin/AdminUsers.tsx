import { useState, useEffect } from 'react';
import { adminApi } from '../../lib/api';
import { Edit, Trash2, Shield, User as UserIcon, X, Search, Download, ShoppingBag, DollarSign, Calendar, Mail, Phone, MapPin, Eye, UserPlus, Users } from 'lucide-react';

interface User {
  id: string | null;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role: 'user' | 'admin';
  created_at: string;
  customer_type?: 'registered' | 'guest';
  total_orders?: number;
  total_spent?: number;
  last_order_date?: string;
  address?: string;
  city?: string;
  state?: string;
}

interface CustomerOrder {
  id: string;
  total_amount: number;
  status: string;
  created_at: string;
  items_count: number;
}

interface CustomerDetails extends User {
  orders: CustomerOrder[];
}

export const AdminUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [viewingCustomer, setViewingCustomer] = useState<CustomerDetails | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'user' | 'admin'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'orders' | 'spent'>('date');
  const [stats, setStats] = useState({
    totalCustomers: 0,
    registeredCustomers: 0,
    guestCustomers: 0,
    activeCustomers: 0,
    totalRevenue: 0,
    avgOrderValue: 0,
    conversionRate: 0,
  });
  const [customerTypeFilter, setCustomerTypeFilter] = useState<'all' | 'registered' | 'guest'>('all');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    role: 'user' as 'user' | 'admin',
  });

  useEffect(() => {
    loadUsers();
    loadStats();
  }, []);

  useEffect(() => {
    filterAndSortUsers();
  }, [users, searchQuery, roleFilter, sortBy, customerTypeFilter]);

  const loadUsers = async () => {
    try {
      // Try new API first (includes registered + guest customers)
      try {
        const data = await adminApi.getAllCustomers();
        setUsers(data);
        return;
      } catch (newApiError) {
        // Fallback to old API if new route not available yet
        console.log('New API not available, using fallback...');
        const data = await adminApi.getUsers();
        setUsers(data);
      }
    } catch (error) {
      console.error('Failed to load customers:', error);
      alert('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // Try new API first
      try {
        const data = await adminApi.getAllCustomers();
        const statsData = data.reduce((acc: any, customer: User) => {
          acc.totalCustomers++;
          if (customer.customer_type === 'registered') acc.registeredCustomers++;
          if (customer.customer_type === 'guest') acc.guestCustomers++;
          acc.totalRevenue += Number(customer.total_spent || 0);
          if (customer.last_order_date) {
            const daysSinceLastOrder = Math.floor(
              (Date.now() - new Date(customer.last_order_date).getTime()) / (1000 * 60 * 60 * 24)
            );
            if (daysSinceLastOrder <= 90) acc.activeCustomers++;
          }
          acc.totalOrders += Number(customer.total_orders || 0);
          return acc;
        }, {
          totalCustomers: 0,
          registeredCustomers: 0,
          guestCustomers: 0,
          activeCustomers: 0,
          totalRevenue: 0,
          totalOrders: 0,
        });

        setStats({
          totalCustomers: statsData.totalCustomers,
          registeredCustomers: statsData.registeredCustomers,
          guestCustomers: statsData.guestCustomers,
          activeCustomers: statsData.activeCustomers,
          totalRevenue: statsData.totalRevenue,
          avgOrderValue: statsData.totalOrders > 0 ? statsData.totalRevenue / statsData.totalOrders : 0,
          conversionRate: statsData.totalCustomers > 0 
            ? (statsData.registeredCustomers / statsData.totalCustomers) * 100 
            : 0,
        });
      } catch (newApiError) {
        // Fallback to old API if new route not available
        console.log('Using fallback stats API...');
        const oldStats = await adminApi.getCustomerStats();
        setStats({
          totalCustomers: oldStats.totalCustomers || 0,
          registeredCustomers: oldStats.totalCustomers || 0,
          guestCustomers: 0,
          activeCustomers: oldStats.activeCustomers || 0,
          totalRevenue: oldStats.totalRevenue || 0,
          avgOrderValue: oldStats.avgOrderValue || 0,
          conversionRate: 100, // Assume all registered in fallback mode
        });
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
      setStats({
        totalCustomers: 0,
        registeredCustomers: 0,
        guestCustomers: 0,
        activeCustomers: 0,
        totalRevenue: 0,
        avgOrderValue: 0,
        conversionRate: 0,
      });
    }
  };

  const filterAndSortUsers = () => {
    let filtered = [...users];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(user => 
        user.email.toLowerCase().includes(query) ||
        (user.firstName && user.firstName.toLowerCase().includes(query)) ||
        (user.lastName && user.lastName.toLowerCase().includes(query)) ||
        (user.phone && user.phone.includes(query))
      );
    }

    // Apply role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    // Apply customer type filter
    if (customerTypeFilter !== 'all') {
      filtered = filtered.filter(user => user.customer_type === customerTypeFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'orders':
          return Number(b.total_orders || 0) - Number(a.total_orders || 0);
        case 'spent':
          return Number(b.total_spent || 0) - Number(a.total_spent || 0);
        case 'date':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    setFilteredUsers(filtered);
  };

  const handleOpenModal = (user?: User) => {
    // Only allow editing registered users
    if (!user || !user.id) {
      alert('Guest customers cannot be edited. Invite them to register first.');
      return;
    }
    
    if (user) {
      setEditingUser(user);
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || '',
        role: user.role || 'user',
      });
    } else {
      setEditingUser(null);
      setFormData({
        firstName: '',
        lastName: '',
        phone: '',
        role: 'user',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser || !editingUser.id) return;

    try {
      await adminApi.updateUser(editingUser.id, formData);
      await loadUsers();
      handleCloseModal();
    } catch (error: any) {
      alert(error.message || 'Failed to update user');
    }
  };

  const handleDelete = async (id: string | null) => {
    if (!id) {
      alert('Cannot delete guest customers');
      return;
    }
    
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      await adminApi.deleteUser(id);
      await loadUsers();
    } catch (error: any) {
      alert(error.message || 'Failed to delete user');
    }
  };

  const handleResetPassword = async (id: string | null) => {
    if (!id) {
      alert('Cannot reset password for guest customers');
      return;
    }
    
    const newPassword = prompt('Enter new password (min 6 characters):');
    if (!newPassword || newPassword.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }

    try {
      await adminApi.resetUserPassword(id, newPassword);
      alert('Password reset successfully');
    } catch (error: any) {
      alert(error.message || 'Failed to reset password');
    }
  };

  const handleViewCustomer = async (user: User) => {
    try {
      // Try email-based API first (works for both registered and guest)
      try {
        const customerData = await adminApi.getCustomerByEmail(user.email);
        setViewingCustomer(customerData);
        setIsDetailsModalOpen(true);
        return;
      } catch (newApiError) {
        // Fallback to old API for registered users only
        if (user.id) {
          const customerData = await adminApi.getCustomerDetails(user.id);
          setViewingCustomer(customerData);
          setIsDetailsModalOpen(true);
        } else {
          alert('Guest customer details require server restart. Please restart your server.');
        }
      }
    } catch (error: any) {
      alert(error.message || 'Failed to load customer details');
    }
  };

  const handleInviteGuest = async (email: string) => {
    if (!confirm(`Send invitation to ${email} to create an account?`)) return;

    try {
      await adminApi.inviteGuestCustomer(email);
      alert(`Invitation sent to ${email}!\n\n(In production, this would send an email with registration link)`);
    } catch (error: any) {
      alert(error.message || 'Failed to send invitation');
    }
  };

  const handleExportCustomers = () => {
    const csvContent = [
      ['Email', 'First Name', 'Last Name', 'Phone', 'Role', 'Total Orders', 'Total Spent', 'Joined Date'].join(','),
      ...filteredUsers.map(user => 
        [
          user.email,
          user.firstName || '',
          user.lastName || '',
          user.phone || '',
          user.role,
          user.total_orders || 0,
          user.total_spent || 0,
          new Date(user.created_at).toLocaleDateString()
        ].join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customers-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-400">Loading customers...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Customer Management</h2>
        <button
          onClick={handleExportCustomers}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 border border-gray-700"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Total Customers</p>
              <p className="text-2xl font-bold text-white mt-1">{stats.totalCustomers || 0}</p>
            </div>
            <Users className="w-8 h-8 text-blue-400" />
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Registered</p>
              <p className="text-2xl font-bold text-white mt-1">{stats.registeredCustomers || 0}</p>
              <p className="text-xs text-green-400 mt-1">{stats.conversionRate.toFixed(1)}% of total</p>
            </div>
            <Shield className="w-8 h-8 text-green-400" />
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Guest</p>
              <p className="text-2xl font-bold text-white mt-1">{stats.guestCustomers || 0}</p>
              <p className="text-xs text-orange-400 mt-1">No account</p>
            </div>
            <UserIcon className="w-8 h-8 text-orange-400" />
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Active (90d)</p>
              <p className="text-2xl font-bold text-white mt-1">{stats.activeCustomers || 0}</p>
            </div>
            <ShoppingBag className="w-8 h-8 text-purple-400" />
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Total Revenue</p>
              <p className="text-2xl font-bold text-white mt-1">${(stats.totalRevenue || 0).toFixed(2)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-yellow-400" />
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Avg Order</p>
              <p className="text-2xl font-bold text-white mt-1">${(stats.avgOrderValue || 0).toFixed(2)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-cyan-400" />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-gray-600 focus:border-gray-600"
              />
            </div>
          </div>

          {/* Customer Type Filter */}
          <div>
            <select
              value={customerTypeFilter}
              onChange={(e) => setCustomerTypeFilter(e.target.value as 'all' | 'registered' | 'guest')}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-gray-600 focus:border-gray-600"
            >
              <option value="all">All Customers</option>
              <option value="registered">✓ Registered</option>
              <option value="guest">👤 Guest Only</option>
            </select>
          </div>

          {/* Role Filter */}
          <div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as 'all' | 'user' | 'admin')}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-gray-600 focus:border-gray-600"
            >
              <option value="all">All Roles</option>
              <option value="user">Users</option>
              <option value="admin">Admins</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'orders' | 'spent')}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-gray-600 focus:border-gray-600"
            >
              <option value="date">Sort by Date</option>
              <option value="orders">Sort by Orders</option>
              <option value="spent">Sort by Spent</option>
            </select>
          </div>
        </div>

        {/* Results Count */}
        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="text-gray-400">
            Showing {filteredUsers.length} of {users.length} customers
            {customerTypeFilter !== 'all' && (
              <span className="ml-2">
                ({customerTypeFilter === 'registered' ? '✓ Registered' : '👤 Guest'} only)
              </span>
            )}
          </span>
          {stats.guestCustomers > 0 && (
            <span className="text-orange-400">
              💡 {stats.guestCustomers} guest{stats.guestCustomers !== 1 ? 's' : ''} without account
            </span>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-800">
            <thead className="bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Orders</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Total Spent</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Last Order</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Joined</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-gray-900 divide-y divide-gray-800">
              {filteredUsers.map((user) => (
                <tr key={user.email} className="hover:bg-gray-800 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
                        user.customer_type === 'guest' ? 'bg-orange-600' : 'bg-gray-700'
                      }`}>
                        {(user.firstName?.[0] || user.email[0]).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-white">
                            {user.firstName || user.lastName
                              ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                              : 'No name'}
                          </span>
                          {user.customer_type === 'guest' && (
                            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
                              Guest
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-400">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-white">
                      {user.phone || '-'}
                    </div>
                    {user.city && (
                      <div className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" />
                        {user.city}, {user.state}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {user.role === 'admin' ? (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-800 text-gray-300 border border-gray-700 inline-flex items-center gap-1">
                        <Shield className="w-3 h-3" />
                        Admin
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-800 text-gray-400 border border-gray-700 inline-flex items-center gap-1">
                        <UserIcon className="w-3 h-3" />
                        User
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-white">
                    {user.total_orders || 0}
                  </td>
                  <td className="px-6 py-4 text-sm text-white font-medium">
                    ${Number(user.total_spent || 0).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400">
                    {user.last_order_date 
                      ? new Date(user.last_order_date).toLocaleDateString()
                      : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleViewCustomer(user)}
                        className="text-gray-400 hover:text-white transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      {user.customer_type === 'guest' ? (
                        <>
                          <button
                            onClick={() => handleInviteGuest(user.email)}
                            className="text-orange-400 hover:text-orange-300 transition-colors"
                            title="Invite to Register"
                          >
                            <UserPlus className="w-5 h-5" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleOpenModal(user)}
                            className="text-gray-400 hover:text-white transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleResetPassword(user.id)}
                            className="text-gray-400 hover:text-white transition-colors"
                            title="Reset Password"
                          >
                            🔑
                          </button>
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="text-gray-400 hover:text-red-400 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            No customers found
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {isModalOpen && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-80">
          <div className="bg-gray-900 border border-gray-800 rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white">Edit User</h3>
              <button onClick={handleCloseModal} className="p-2 hover:bg-gray-800 rounded-full text-gray-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                <input
                  type="email"
                  value={editingUser.email}
                  disabled
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">First Name</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-gray-600 focus:border-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-gray-600 focus:border-gray-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-gray-600 focus:border-gray-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as 'user' | 'admin' })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-gray-600 focus:border-gray-600"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="flex-1 bg-gray-800 text-white py-3 rounded-lg font-semibold hover:bg-gray-700 border border-gray-700"
                >
                  Update User
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-6 py-3 border border-gray-700 rounded-lg font-semibold text-gray-300 hover:bg-gray-800"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Details Modal */}
      {isDetailsModalOpen && viewingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-80 overflow-y-auto">
          <div className="bg-gray-900 border border-gray-800 rounded-lg max-w-3xl w-full p-6 my-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white">Customer Details</h3>
              <button 
                onClick={() => setIsDetailsModalOpen(false)} 
                className="p-2 hover:bg-gray-800 rounded-full text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Customer Info */}
            <div className="bg-gray-800 rounded-lg p-6 mb-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center text-white text-2xl font-semibold">
                  {(viewingCustomer.firstName?.[0] || viewingCustomer.email[0]).toUpperCase()}
                </div>
                <div className="flex-1">
                  <h4 className="text-xl font-bold text-white mb-1">
                    {viewingCustomer.firstName || viewingCustomer.lastName
                      ? `${viewingCustomer.firstName || ''} ${viewingCustomer.lastName || ''}`.trim()
                      : 'No name provided'}
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-gray-300">
                      <Mail className="w-4 h-4 text-gray-400" />
                      {viewingCustomer.email}
                    </div>
                    {viewingCustomer.phone && (
                      <div className="flex items-center gap-2 text-gray-300">
                        <Phone className="w-4 h-4 text-gray-400" />
                        {viewingCustomer.phone}
                      </div>
                    )}
                    {(viewingCustomer.city || viewingCustomer.state) && (
                      <div className="flex items-center gap-2 text-gray-300">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        {viewingCustomer.city}, {viewingCustomer.state}
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-gray-300">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      Joined {new Date(viewingCustomer.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-700">
                <div>
                  <p className="text-sm text-gray-400">Total Orders</p>
                  <p className="text-2xl font-bold text-white">{viewingCustomer.total_orders || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Total Spent</p>
                  <p className="text-2xl font-bold text-white">${Number(viewingCustomer.total_spent || 0).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Avg Order</p>
                  <p className="text-2xl font-bold text-white">
                    ${viewingCustomer.total_orders 
                      ? (Number(viewingCustomer.total_spent || 0) / viewingCustomer.total_orders).toFixed(2)
                      : '0.00'}
                  </p>
                </div>
              </div>
            </div>

            {/* Orders History */}
            <div>
              <h5 className="text-lg font-bold text-white mb-4">Order History</h5>
              {viewingCustomer.orders && viewingCustomer.orders.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {viewingCustomer.orders.map((order) => (
                    <div key={order.id} className="bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-sm font-semibold text-white">Order #{order.id.slice(0, 8)}</p>
                          <p className="text-xs text-gray-400">{new Date(order.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-white">${Number(order.total_amount || 0).toFixed(2)}</p>
                          <p className="text-xs text-gray-400">{order.items_count} items</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          order.status === 'delivered' ? 'bg-green-500/10 text-green-400 border border-green-500/30' :
                          order.status === 'shipped' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30' :
                          order.status === 'processing' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30' :
                          order.status === 'cancelled' ? 'bg-red-500/10 text-red-400 border border-red-500/30' :
                          'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30'
                        }`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-800 rounded-lg p-8 text-center">
                  <ShoppingBag className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                  <p className="text-gray-400">No orders yet</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6 pt-6 border-t border-gray-800">
              <button
                onClick={() => {
                  setIsDetailsModalOpen(false);
                  handleOpenModal(viewingCustomer);
                }}
                className="flex-1 bg-gray-800 text-white py-3 rounded-lg font-semibold hover:bg-gray-700 border border-gray-700"
              >
                Edit Customer
              </button>
              <button
                onClick={() => setIsDetailsModalOpen(false)}
                className="px-6 py-3 border border-gray-700 rounded-lg font-semibold text-gray-300 hover:bg-gray-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

