import React, { useState, useEffect } from 'react';
import { customerService } from '../../services/customerService';
import type { Customer } from '../../types/customer';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { Input } from '../../components/Input';

export const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const [customerForm, setCustomerForm] = useState({
    student_id: '',
    first_name: '',
    last_name: '',
    course: '',
    phone: '',
    type: 'student' as 'student' | 'teacher',
  });

  useEffect(() => {
    fetchCustomers();
  }, [searchQuery]);

  const fetchCustomers = async () => {
    try {
      const data = await customerService.getCustomers({
        search: searchQuery || undefined,
      });
      setCustomers(Array.isArray(data.data) ? data.data : data);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const handleCreateCustomer = async () => {
    setLoading(true);
    try {
      if (isEditMode && selectedCustomer) {
        await customerService.updateCustomer(selectedCustomer.id, customerForm);
      } else {
        await customerService.createCustomer(customerForm);
      }
      setShowAddModal(false);
      resetForm();
      setIsEditMode(false);
      setSelectedCustomer(null);
      fetchCustomers();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          `Error ${isEditMode ? 'updating' : 'creating'} customer`;
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerForm({
      student_id: customer.student_id || '',
      first_name: customer.first_name,
      last_name: customer.last_name,
      course: customer.course || '',
      phone: customer.phone || '',
      type: customer.type,
    });
    setIsEditMode(true);
    setShowAddModal(true);
  };

  const handleDeleteCustomer = async (customer: Customer) => {
    if (!confirm(`Are you sure you want to delete "${customer.first_name} ${customer.last_name}"? This action cannot be undone.`)) {
      return;
    }

    setLoading(true);
    try {
      await customerService.deleteCustomer(customer.id);
      fetchCustomers();
      alert('Customer deleted successfully');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          'Error deleting customer';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;
    setLoading(true);
    try {
      await customerService.importCustomers(selectedFile);
      setShowImportModal(false);
      setSelectedFile(null);
      fetchCustomers();
      alert('Customers imported successfully!');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error importing customers');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setCustomerForm({
      student_id: '',
      first_name: '',
      last_name: '',
      course: '',
      phone: '',
      type: 'student',
    });
    setIsEditMode(false);
    setSelectedCustomer(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Customer Management</h1>
        <div className="flex space-x-2">
          <Button variant="secondary" onClick={() => setShowImportModal(true)}>
            📤 Upload Excel
          </Button>
          <Button onClick={() => setShowAddModal(true)}>+ Add Customer</Button>
        </div>
      </div>

      <input
        type="text"
        placeholder="Search customers..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
      />

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {customers.map((customer) => (
              <tr key={customer.id}>
                <td className="px-6 py-4 whitespace-nowrap">{customer.student_id || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {customer.first_name} {customer.last_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{customer.course || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap capitalize">{customer.type}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleEditCustomer(customer)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleDeleteCustomer(customer)}
                      disabled={loading}
                    >
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Customer Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          resetForm();
        }}
        title={isEditMode ? "Edit Customer" : "Add Customer"}
      >
        <div className="space-y-4">
          <Input
            label="Student ID"
            value={customerForm.student_id}
            onChange={(e) => setCustomerForm({ ...customerForm, student_id: e.target.value })}
          />
          <Input
            label="First Name"
            value={customerForm.first_name}
            onChange={(e) => setCustomerForm({ ...customerForm, first_name: e.target.value })}
            required
          />
          <Input
            label="Last Name"
            value={customerForm.last_name}
            onChange={(e) => setCustomerForm({ ...customerForm, last_name: e.target.value })}
            required
          />
          <Input
            label="Course"
            value={customerForm.course}
            onChange={(e) => setCustomerForm({ ...customerForm, course: e.target.value })}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={customerForm.type}
              onChange={(e) => setCustomerForm({ ...customerForm, type: e.target.value as 'student' | 'teacher' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
            </select>
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowAddModal(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateCustomer} isLoading={loading}>
              {isEditMode ? 'Update Customer' : 'Create Customer'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Import Excel Modal */}
      <Modal
        isOpen={showImportModal}
        onClose={() => {
          setShowImportModal(false);
          setSelectedFile(null);
        }}
        title="Import Customers from Excel"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Upload an Excel file with columns: Student ID, First Name, Last Name, Course, Phone, Type
          </p>
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowImportModal(false);
                setSelectedFile(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleImport} isLoading={loading} disabled={!selectedFile}>
              Import
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

