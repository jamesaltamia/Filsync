import React, { useState, useEffect } from 'react';
import { customerService } from '../../services/customerService';
import type { Customer } from '../../types/customer';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { Input } from '../../components/Input';

export const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showStudentAddModal, setShowStudentAddModal] = useState(false);
  const [showTeacherAddModal, setShowTeacherAddModal] = useState(false);
  const [showStudentImportModal, setShowStudentImportModal] = useState(false);
  const [showTeacherImportModal, setShowTeacherImportModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const [studentForm, setStudentForm] = useState({
    student_id: '',
    first_name: '',
    last_name: '',
    year_level: '',
    course: '',
    type: 'student' as const,
  });

  const [teacherForm, setTeacherForm] = useState({
    student_id: '',
    first_name: '',
    last_name: '',
    department: '',
    type: 'teacher' as const,
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

  const students = customers.filter(c => c.type === 'student');
  const teachers = customers.filter(c => c.type === 'teacher');

  const handleCreateCustomer = async (type: 'student' | 'teacher') => {
    setLoading(true);
    try {
      const formData = type === 'student' ? studentForm : teacherForm;
      if (isEditMode && selectedCustomer) {
        await customerService.updateCustomer(selectedCustomer.id, formData);
      } else {
        await customerService.createCustomer(formData);
      }
      if (type === 'student') {
        setShowStudentAddModal(false);
        resetStudentForm();
      } else {
        setShowTeacherAddModal(false);
        resetTeacherForm();
      }
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
    if (customer.type === 'student') {
      setStudentForm({
        student_id: customer.student_id || '',
        first_name: customer.first_name,
        last_name: customer.last_name,
        year_level: customer.year_level || '',
        course: customer.course || '',
        type: 'student',
      });
      setIsEditMode(true);
      setShowStudentAddModal(true);
    } else {
      setTeacherForm({
        student_id: customer.student_id || '',
        first_name: customer.first_name,
        last_name: customer.last_name,
        department: customer.department || '',
        type: 'teacher',
      });
      setIsEditMode(true);
      setShowTeacherAddModal(true);
    }
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

  const handleImport = async (type: 'student' | 'teacher') => {
    if (!selectedFile) return;
    setLoading(true);
    try {
      await customerService.importCustomers(selectedFile, type);
      if (type === 'student') {
        setShowStudentImportModal(false);
      } else {
        setShowTeacherImportModal(false);
      }
      setSelectedFile(null);
      fetchCustomers();
      alert(`${type === 'student' ? 'Students' : 'Teachers'} imported successfully!`);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error importing customers');
    } finally {
      setLoading(false);
    }
  };

  const resetStudentForm = () => {
    setStudentForm({
      student_id: '',
      first_name: '',
      last_name: '',
      year_level: '',
      course: '',
      type: 'student',
    });
    setIsEditMode(false);
    setSelectedCustomer(null);
  };

  const resetTeacherForm = () => {
    setTeacherForm({
      student_id: '',
      first_name: '',
      last_name: '',
      department: '',
      type: 'teacher',
    });
    setIsEditMode(false);
    setSelectedCustomer(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold dark:text-white">Customer Management</h1>
        <div className="flex space-x-2">
          <Button variant="secondary" onClick={() => setShowStudentImportModal(true)}>
            📤 Upload Students
          </Button>
          <Button onClick={() => setShowStudentAddModal(true)}>+ Add Student</Button>
        </div>
      </div>

      <input
        type="text"
        placeholder="Search customers..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white"
      />

      {/* Students Table */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 dark:bg-slate-900/50 border-b border-gray-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Students</h2>
        </div>
        <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
          <thead className="bg-gray-50 dark:bg-slate-900/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Grade/Year level</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Course/Strand</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
            {students.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500 dark:text-slate-400">
                  No students found
                </td>
              </tr>
            ) : (
              students.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 text-gray-800 dark:text-slate-200">
                  <td className="px-6 py-4 whitespace-nowrap">{customer.student_id || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {customer.first_name} {customer.last_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{customer.year_level || 'N/A'}</td>
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
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold"></h1>
        <div className="flex space-x-2">
          <Button variant="secondary" onClick={() => setShowTeacherImportModal(true)}>
            📤 Upload Teachers
          </Button>
          <Button onClick={() => setShowTeacherAddModal(true)}>+ Add Teacher</Button>
        </div>
      </div>

      {/* Teachers Table */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 dark:bg-slate-900/50 border-b border-gray-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Teachers</h2>
        </div>
        <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
          <thead className="bg-gray-50 dark:bg-slate-900/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Department</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
            {teachers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500 dark:text-slate-400">
                  No teachers found
                </td>
              </tr>
            ) : (
              teachers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 text-gray-800 dark:text-slate-200">
                  <td className="px-6 py-4 whitespace-nowrap">{customer.student_id || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {customer.first_name} {customer.last_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{customer.department || 'N/A'}</td>
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
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Student Modal */}
      <Modal
        isOpen={showStudentAddModal}
        onClose={() => {
          setShowStudentAddModal(false);
          resetStudentForm();
        }}
        title={isEditMode ? "Edit Student" : "Add Student"}
      >
        <div className="space-y-4">
          <Input
            label="Student ID"
            value={studentForm.student_id}
            onChange={(e) => setStudentForm({ ...studentForm, student_id: e.target.value })}
          />
          <Input
            label="First Name"
            value={studentForm.first_name}
            onChange={(e) => setStudentForm({ ...studentForm, first_name: e.target.value })}
            required
          />
          <Input
            label="Last Name"
            value={studentForm.last_name}
            onChange={(e) => setStudentForm({ ...studentForm, last_name: e.target.value })}
            required
          />
          <Input
            label="Year Level"
            value={studentForm.year_level}
            onChange={(e) => setStudentForm({ ...studentForm, year_level: e.target.value })}
          />
          <Input
            label="Course/Strand"
            value={studentForm.course}
            onChange={(e) => setStudentForm({ ...studentForm, course: e.target.value })}
          />
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowStudentAddModal(false);
                resetStudentForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={() => handleCreateCustomer('student')} isLoading={loading}>
              {isEditMode ? 'Update Student' : 'Create Student'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add/Edit Teacher Modal */}
      <Modal
        isOpen={showTeacherAddModal}
        onClose={() => {
          setShowTeacherAddModal(false);
          resetTeacherForm();
        }}
        title={isEditMode ? "Edit Teacher" : "Add Teacher"}
      >
        <div className="space-y-4">
          <Input
            label="ID"
            value={teacherForm.student_id}
            onChange={(e) => setTeacherForm({ ...teacherForm, student_id: e.target.value })}
          />
          <Input
            label="First Name"
            value={teacherForm.first_name}
            onChange={(e) => setTeacherForm({ ...teacherForm, first_name: e.target.value })}
            required
          />
          <Input
            label="Last Name"
            value={teacherForm.last_name}
            onChange={(e) => setTeacherForm({ ...teacherForm, last_name: e.target.value })}
            required
          />
          <Input
            label="Department"
            value={teacherForm.department}
            onChange={(e) => setTeacherForm({ ...teacherForm, department: e.target.value })}
          />
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowTeacherAddModal(false);
                resetTeacherForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={() => handleCreateCustomer('teacher')} isLoading={loading}>
              {isEditMode ? 'Update Teacher' : 'Create Teacher'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Import Students Excel Modal */}
      <Modal
        isOpen={showStudentImportModal}
        onClose={() => {
          setShowStudentImportModal(false);
          setSelectedFile(null);
        }}
        title="Import Students from Excel"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-slate-300">
            Upload an Excel file with columns: <strong>ID, NAME, GRADE/YEAR LEVEL, COURSE/STRAND, TYPE</strong>
            <br />
            <span className="text-xs text-gray-500 dark:text-slate-400">Note: NAME should be the full name (first and last name together)</span>
          </p>
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg dark:text-white"
          />
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowStudentImportModal(false);
                setSelectedFile(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={() => handleImport('student')} isLoading={loading} disabled={!selectedFile}>
              Import Students
            </Button>
          </div>
        </div>
      </Modal>

      {/* Import Teachers Excel Modal */}
      <Modal
        isOpen={showTeacherImportModal}
        onClose={() => {
          setShowTeacherImportModal(false);
          setSelectedFile(null);
        }}
        title="Import Teachers from Excel"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-slate-300">
            Upload an Excel file with columns: <strong>ID, NAME, DEPARTMENT, TYPE</strong>
            <br />
            <span className="text-xs text-gray-500 dark:text-slate-400">Note: NAME should be the full name (first and last name together)</span>
          </p>
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg dark:text-white"
          />
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowTeacherImportModal(false);
                setSelectedFile(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={() => handleImport('teacher')} isLoading={loading} disabled={!selectedFile}>
              Import Teachers
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

