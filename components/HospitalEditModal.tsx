import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface HospitalFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: any) => Promise<void>;
  initialData?: any | null;
}

export default function HospitalEditModal({ isOpen, onClose, onSave, initialData }: HospitalFormModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    hospitalName: '',
    state: '',
    contactPerson: '',
    phone: '',
    amountGiven: 0,
    amountUsed: 0,
    supplyStatus: 'active',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        hospitalName: initialData.hospitalName || '',
        state: initialData.state || '',
        contactPerson: initialData.contactPerson || '',
        phone: initialData.phone || '',
        amountGiven: initialData.amountGiven || 0,
        amountUsed: initialData.amountUsed || 0,
        supplyStatus: initialData.supplyStatus || 'active',
      });
    } else {
      setFormData({
        name: '',
        hospitalName: '',
        state: '',
        contactPerson: '',
        phone: '',
        amountGiven: 0,
        amountUsed: 0,
        supplyStatus: 'active',
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await onSave(formData);
    } catch (err: any) {
      alert(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-card w-full max-w-lg rounded-2xl shadow-xl border border-border overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/50">
          <h2 className="text-lg font-bold text-foreground">
            {initialData ? 'Edit Hospital Partner' : 'Onboard Hospital Partner'}
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted text-muted-foreground">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Vendor Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
                placeholder="e.g. Apollo Health"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Hospital/Facility Name</label>
              <input
                type="text"
                value={formData.hospitalName}
                onChange={(e) => setFormData({ ...formData, hospitalName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
                placeholder="e.g. Apollo Hospital Delhi"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">State</label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
                placeholder="e.g. Delhi"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Status</label>
              <select
                value={formData.supplyStatus}
                onChange={(e) => setFormData({ ...formData, supplyStatus: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Contact Person</label>
              <input
                type="text"
                value={formData.contactPerson}
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
                placeholder="Person name"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Phone Number</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
                placeholder="Phone number"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Amount Given (₹)</label>
              <input
                type="number"
                value={formData.amountGiven}
                onChange={(e) => setFormData({ ...formData, amountGiven: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Amount Used (₹)</label>
              <input
                type="number"
                value={formData.amountUsed}
                onChange={(e) => setFormData({ ...formData, amountUsed: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-muted transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-purple-600 text-white text-sm font-semibold hover:opacity-90 transition disabled:opacity-50"
            >
              {loading ? 'Saving...' : initialData ? 'Update Partner' : 'Onboard Partner'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}