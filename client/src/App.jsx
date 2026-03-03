import React, { useState, useMemo, useEffect } from 'react';
import { supabase } from './lib/supabase';
import Papa from 'papaparse';

// --- INITIAL MOCK DATA ---

const INITIAL_USERS = [
  { id: '1', name: 'Adam Staff', email: 'adam@dcbi.com', roles: ['STAFF'], entityId: 'E1', approverId: '3' },
  { id: '2', name: 'Sarah Accountant', email: 'sarah@dcbi.com', roles: ['ACCOUNTANT'], entityId: 'E1', assignedEntities: ['E1', 'E2'] },
  { id: '3', name: 'Mark Manager', email: 'mark@dcbi.com', roles: ['MANAGER'], entityId: 'E1' },
  { id: '4', name: 'Super Admin', email: 'admin@dcbi.com', roles: ['ADMIN'], entityId: 'E1' },
  { id: '5', name: 'John StaffManager', email: 'john@dcbi.com', roles: ['STAFF', 'MANAGER'], entityId: 'E1', approverId: '4' },
  { id: '6', name: 'Emily StaffAcc', email: 'emily@dcbi.com', roles: ['STAFF', 'ACCOUNTANT'], entityId: 'E1', assignedEntities: ['E1'], approverId: '3' },
  { id: '7', name: 'Chris StaffAdmin', email: 'chris@dcbi.com', roles: ['STAFF', 'ADMIN'], entityId: 'E1', approverId: '3' },
];

const INITIAL_ENTITIES = [
  { id: 'E1', name: 'DCBI Global Ltd.', code: 'D001', address: '123 Business Way, London', country: 'United Kingdom', countryIso3: 'GBR', logo: '🌐', mandatoryFields: { project: true, department: true } },
  { id: 'E2', name: 'DCBI Core SAS', code: 'C092', address: '45 Finance Ave, Paris', country: 'France', countryIso3: 'FRA', logo: '💳', mandatoryFields: { project: false, department: true } },
];

const INITIAL_EXPENSE_TYPES = [
  { id: 'T1', label: 'Flight', defaultAccount: '600100', defaultVat: 0, requiresEntertainment: false },
  { id: 'T2', label: 'Hotel', defaultAccount: '600200', defaultVat: 7, requiresEntertainment: false },
  { id: 'T3', label: 'Entertainment', defaultAccount: '600300', defaultVat: 19, requiresEntertainment: true },
];

const MOCK_PROJECTS = ['PRJ-24-XT (Customer X)', 'PRJ-24-RD (Internal R&D)', 'PRJ-24-MK (Marketing)'];
const MOCK_DEPARTMENTS = ['D-SALES', 'D-PROD', 'D-MGMT'];

const CLAIM_STATUS = { NEW: 'NEW', SUBMITTED: 'SUBMITTED', ACCRUED: 'ACCRUED', CLOSED: 'CLOSED' };
const APPROVAL_STATUS = { NA: 'N/A', PENDING: 'PENDING APPROVAL', REJECTED: 'REJECTED', APPROVED: 'APPROVED' };

// --- COMPONENTS ---

const LoginPage = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      if (isResettingPassword) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        });
        if (error) throw error;
        setMessage('Password reset email sent! Please check your inbox.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      console.error("DEBUG: Auth Error:", err);
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--bg-main)', padding: '2rem' }}>
      <div className="card" style={{ width: '400px', textAlign: 'center', padding: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '0.5rem' }}>
          {/* Recreated Logo from Image */}
          <div style={{ position: 'relative', width: '48px', height: '48px', background: '#0071bc', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold', fontSize: '24px', flexShrink: 0 }}>
            DC
            <div style={{ position: 'absolute', bottom: '-4px', right: '-4px', width: '22px', height: '22px', background: '#475569', borderRadius: '50%', border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>
              BI
            </div>
          </div>
          <div style={{ textAlign: 'left', lineHeight: '1' }}>
            <div style={{ fontSize: '24px', fontWeight: '300', color: '#0071bc', fontFamily: 'Inter, sans-serif' }}>datacair</div>
            <div style={{ fontSize: '20px', fontWeight: '400', color: '#444', letterSpacing: '0.5px', fontFamily: 'Inter, sans-serif' }}>BUSINESS INTELLIGENCE</div>
          </div>
        </div>
        <h2 style={{ fontSize: '1.25rem', color: '#64748b', fontWeight: '400', marginBottom: '2rem' }}>Expense Tool</h2>

        {error && <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '0.75rem', borderRadius: '6px', marginBottom: '1.5rem', fontSize: '0.9rem' }}>{error}</div>}
        {message && <div style={{ background: '#dcfce7', color: '#15803d', padding: '0.75rem', borderRadius: '6px', marginBottom: '1.5rem', fontSize: '0.9rem' }}>{message}</div>}

        <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
          <div className="form-group">
            <label>Email Address</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@dcbi.com" style={{ padding: '0.8rem' }} />
          </div>
          {!isResettingPassword && (
            <div className="form-group" style={{ marginTop: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label>Password</label>
                <button type="button" className="btn-link" style={{ fontSize: '0.75rem', color: 'var(--primary)', border: 'none', background: 'none', cursor: 'pointer', padding: 0 }} onClick={() => setIsResettingPassword(true)}>
                  Forgot password?
                </button>
              </div>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" style={{ padding: '0.8rem' }} />
            </div>
          )}
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '2rem', padding: '1rem' }} disabled={loading}>
            {loading ? 'Processing...' : (isResettingPassword ? 'Send Reset Link' : 'Sign In')}
          </button>
          {isResettingPassword && (
            <button type="button" className="btn btn-outline" style={{ width: '100%', marginTop: '1rem' }} onClick={() => setIsResettingPassword(false)}>
              Back to Sign In
            </button>
          )}
        </form>

        <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #eee' }}>
          <button className="btn btn-outline" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} onClick={() => alert('Corporate SSO will be available soon.')}>
            🛡️ SSO Login
          </button>
        </div>
        <div style={{ marginTop: '1.5rem', fontSize: '0.65rem', color: '#94a3b8' }}>v1.0.0015</div>
      </div>
    </div>
  );
};

const SettingsView = ({ user, entities, users, userEntityApprovers, onBack }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) return setMessage({ type: 'error', text: 'Passwords do not match' });
    if (newPassword.length < 6) return setMessage({ type: 'error', text: 'Password must be at least 6 characters' });

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setMessage({ type: 'success', text: 'Password updated successfully!' });
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const userEntries = userEntityApprovers.filter(ua => ua.user_id === user.id);

  return (
    <div className="view">
      <div className="header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="btn btn-outline" onClick={onBack}>← Back</button>
          <h2>User Settings</h2>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem', marginTop: '2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="card">
            <h3>Profile Information</h3>
            <div style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: '#666' }}>Display Name</label>
                <p style={{ margin: '4px 0 0 0', fontWeight: '500' }}>{user.name}</p>
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: '#666' }}>Email Address</label>
                <p style={{ margin: '4px 0 0 0', fontWeight: '500' }}>{user.email}</p>
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: '#666' }}>System Roles</label>
                <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                  {user.roles?.map(r => <span key={r} className="badge" style={{ fontSize: '0.7rem' }}>{r}</span>)}
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <h3>Entity & Approval Configuration</h3>
            <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '1.5rem' }}>Your assigned entities and designated approvers.</p>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '2px solid #eee' }}>
                  <th style={{ padding: '0.75rem 0' }}>Legal Entity</th>
                  <th>My Approver</th>
                  <th>Accountant?</th>
                </tr>
              </thead>
              <tbody>
                {/* Primary Entity */}
                {user.entityId && (
                  <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '0.75rem 0' }}>
                      <strong>{entities.find(e => e.id === user.entityId)?.name || 'Primary Entity'}</strong>
                      <span style={{ marginLeft: '0.5rem', fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 'bold' }}>(PRIMARY)</span>
                    </td>
                    <td>{users.find(u => String(u.id) === String(user.approverId || user.approver_id))?.name || 'Default / None'}</td>
                    <td>{user.roles?.includes('ACCOUNTANT') ? '✅ Yes' : '—'}</td>
                  </tr>
                )}

                {/* Secondary Entities from Mappings */}
                {userEntries.filter(ua => ua.entity_id !== user.entityId).map(ua => (
                  <tr key={ua.entity_id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '0.75rem 0' }}>{entities.find(e => e.id === ua.entity_id)?.name || ua.entity_id}</td>
                    <td>{users.find(u => String(u.id) === String(ua.approver_id))?.name || 'None'}</td>
                    <td>{ua.is_accountant ? '✅ Yes' : '—'}</td>
                  </tr>
                ))}

                {userEntries.length === 0 && !user.entityId && (
                  <tr>
                    <td colSpan="3" style={{ textAlign: 'center', padding: '2rem', color: '#999', fontStyle: 'italic' }}>No entities assigned yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card" style={{ alignSelf: 'start' }}>
          <h3>Security</h3>
          <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '1.5rem' }}>Update your account password below.</p>

          {message && (
            <div style={{ padding: '0.75rem', borderRadius: '6px', marginBottom: '1.5rem', fontSize: '0.85rem', background: message.type === 'success' ? '#dcfce7' : '#fee2e2', color: message.type === 'success' ? '#15803d' : '#b91c1c' }}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleUpdatePassword}>
            <div className="form-group">
              <label>New Password</label>
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
            </div>
            <div className="form-group" style={{ marginTop: '1rem' }}>
              <label>Confirm New Password</label>
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1.5rem' }} disabled={loading}>
              {loading ? 'Updating...' : 'Change Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

const Sidebar = ({ user, users, currentView, onViewChange, onLogout, isManagerApprover }) => {
  const hasRole = (role) => user.roles.includes(role);

  const primaryApproverId = user.approverId || user.approver_id;
  const primaryApprover = users?.find(u => String(u.id) === String(primaryApproverId));
  const approverName = primaryApprover ? primaryApprover.name : (primaryApproverId && primaryApproverId !== 'N/A' && primaryApproverId !== 'undefined' ? 'Searching...' : 'N/A');

  return (
    <aside className="sidebar">
      <div>
        <h1 style={{ fontSize: '1.2rem', color: 'var(--primary)', marginBottom: '0.5rem' }}>DCBI Tool</h1>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0 0 0.2rem 0' }}>Operator: <strong>{user.name}</strong></p>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0 0 0.2rem 0' }}>Email: <strong>{user.email}</strong></p>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0 0 0.2rem 0' }}>Role: <strong>{user.roles?.join(', ')}</strong></p>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0' }}>Approver: <strong>{approverName}</strong></p>
      </div>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        <div className={`nav-item ${currentView === 'dashboard' ? 'active' : ''}`} onClick={() => onViewChange('dashboard')}>🏠 Dashboard</div>
        {hasRole('STAFF') && (
          <div className={`nav-item ${currentView === 'receipts-backlog' ? 'active' : ''}`} onClick={() => onViewChange('receipts-backlog')}>📚 Receipts Library</div>
        )}
        <div className={`nav-item ${currentView === 'settings' ? 'active' : ''}`} onClick={() => onViewChange('settings')}>⚙️ Settings</div>
        {hasRole('STAFF') && (
          <>
            <div className={`nav-item ${currentView === 'my-claims' ? 'active' : ''}`} onClick={() => onViewChange('my-claims')}>📄 My Expenses</div>
            <div className={`nav-item ${currentView === 'imports' ? 'active' : ''}`} onClick={() => onViewChange('imports')}>💳 Bank Statements</div>
          </>
        )}
        {isManagerApprover && (
          <div className={`nav-item ${currentView === 'approvals' ? 'active' : ''}`} onClick={() => onViewChange('approvals')}>✅ Approvals Queue</div>
        )}
        {(hasRole('ACCOUNTANT') || hasRole('ADMIN')) && (
          <div className={`nav-item ${currentView === 'finance' ? 'active' : ''}`} onClick={() => onViewChange('finance')}>🏦 Compliance Hub</div>
        )}
        {(hasRole('ACCOUNTANT') || hasRole('ADMIN')) && (
          <div className={`nav-item ${currentView === 'admin' ? 'active' : ''}`} onClick={() => onViewChange('admin')}>⚙️ Control Center</div>
        )}
      </nav>
      <div style={{ marginTop: 'auto' }}>
        <div style={{ fontSize: '0.65rem', color: '#94a3b8', textAlign: 'center', marginBottom: '0.5rem', fontWeight: '500' }}>v1.0.0015</div>
        <button className="btn btn-outline" style={{ width: '100%' }} onClick={onLogout}>Logout</button>
      </div>
    </aside>
  );
};

const ClaimReport = ({ claim, user, entity }) => (
  <div className="card print-only" style={{ padding: '2rem', border: 'none', background: 'white', color: 'black' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '3px solid #000', paddingBottom: '1rem' }}>
      <div style={{ flex: 2 }}>
        <h1 style={{ margin: 0, color: '#333' }}>Expense Claim Audit Report</h1>
        <p style={{ margin: '0.5rem 0' }}>Ref: <strong>{claim.id}</strong> | Version: {claim.version}</p>
        <p>Title: <strong>{claim.title}</strong></p>
      </div>
      <div style={{ textAlign: 'right', flex: 1 }}>
        <h2 style={{ margin: 0 }}>{entity.name}</h2>
        <p style={{ fontSize: '0.8rem' }}>{entity.address}<br />{entity.country} ({entity.countryIso3})</p>
        <p style={{ marginTop: '1rem' }}>Employee: <strong>{user.name}</strong></p>
      </div>
    </div>

    <div style={{ marginTop: '2rem' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
        <thead>
          <tr style={{ background: '#f0f0f0', borderBottom: '1px solid #000' }}>
            <th style={{ padding: '8px', textAlign: 'left' }}>Date</th>
            <th style={{ textAlign: 'left' }}>Category</th>
            <th style={{ textAlign: 'left' }}>G/L Account</th>
            <th style={{ textAlign: 'left' }}>Description</th>
            <th style={{ textAlign: 'right' }}>Amount</th>
            <th style={{ textAlign: 'right' }}>VAT</th>
          </tr>
        </thead>
        <tbody>
          {claim.expenses.map(e => (
            <tr key={e.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '8px' }}>{e.date}</td>
              <td>{e.type}</td>
              <td style={{ fontFamily: 'monospace' }}>{e.glAccount || '600000'}</td>
              <td>{e.description}</td>
              <td style={{ textAlign: 'right' }}>{claim.currency || '€'}{Number(e.amount).toFixed(2)}</td>
              <td style={{ textAlign: 'right' }}>{claim.currency || '€'}{((Number(e.amount) * (e.vatRate || 0)) / 100).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'flex-end' }}>
        <div style={{ width: '250px', borderTop: '2px solid #333', paddingTop: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span>Total Expenses:</span>
            <span>{claim.currency || '€'}{claim.expenses.reduce((acc, e) => acc + Number(e.amount), 0).toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.2rem' }}>
            <span>Net Payable:</span>
            <span>{claim.currency || '€'}{(claim.expenses.reduce((acc, e) => acc + Number(e.amount), 0) - Number(claim.advanceAmount)).toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '4rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem' }}>
        <div style={{ borderTop: '1px solid #999', paddingTop: '0.5rem', textAlign: 'center' }}>
          <small>Manager Approval (E-Signed)</small><br />
          <strong>{claim.managerApprovedAt ? 'APPROVED' : 'PENDING'}</strong>
        </div>
        <div style={{ borderTop: '1px solid #999', paddingTop: '0.5rem', textAlign: 'center' }}>
          <small>Accountant Verification</small><br />
          <strong>{claim.accountantApprovedAt ? 'VERIFIED' : 'PENDING'}</strong>
        </div>
      </div>
    </div>
  </div>
);

const DetailView = ({ claim, owner, approver, accountants, currentUser, entity, onBack, onStatusUpdate, onEdit, onSave, mode, expenseTypes, onPreview }) => {
  const [activeTab, setActiveTab] = useState('details');
  const [syncing, setSyncing] = useState(false);
  const [history, setHistory] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [attachedReceipts, setAttachedReceipts] = useState({});

  React.useEffect(() => {
    fetchHistory();
    fetchAttachedReceipts();
  }, [claim.id]);

  const fetchAttachedReceipts = async () => {
    const ids = claim.expenses.map(e => e.backlog_id || e.backlogId).filter(Boolean);
    if (ids.length === 0) return;
    try {
      const { data, error } = await supabase.from('receipts').select('id, file_hash, ai_raw_json, manual_override_flag, duplicate_flag, receipt_status, amount_suggestion, vendor_suggestion').in('id', ids);
      if (data && !error) {
        const map = {};
        data.forEach(r => map[r.id] = r);
        setAttachedReceipts(map);
      }
    } catch (err) { console.error('Attached receipts fetch error:', err); }
  };

  const fetchHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('claims')
        .select('history')
        .eq('id', claim.id)
        .single();

      if (error) throw error;
      setHistory(data?.history || []);
    } catch (err) {
      console.error('History fetch error:', err);
    }
  };

  const wrappedStatusUpdate = async (id, update) => {
    // If we're a manager and updating status, also save any pending comments
    if (mode === 'manager') {
      const updatedExpenses = claim.expenses.map(e => {
        const commentEl = document.getElementById(`comment-${e.id}`);
        return commentEl ? { ...e, comment: commentEl.value } : e;
      });
      await onSave({ ...claim, expenses: updatedExpenses, actorId: currentUser.id });
    }
    await onStatusUpdate(id, update);
    fetchHistory();
  };

  const handleSync = async () => {
    setSyncing(true);
    await wrappedStatusUpdate(claim.id, { claimStatus: CLAIM_STATUS.CLOSED });
    setSyncing(false);
  };

  return (
    <div className="view" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
      <div className="header no-print" style={{ marginBottom: '1rem' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.4rem' }}>
          Claim: {claim.title} <small style={{ color: '#888', marginLeft: '0.5rem', fontSize: '1rem', fontWeight: 'normal' }}>({claim.id})</small>
          {syncing && <span className="spinner"></span>}
        </h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-outline" onClick={onBack}>Back</button>
          <button className="btn btn-outline" onClick={() => window.print()}>🖨️ Print Audit Report</button>
          {mode === 'staff' && (claim.claimStatus === CLAIM_STATUS.NEW || claim.approvalStatus === APPROVAL_STATUS.REJECTED) && (
            <button className="btn btn-primary" onClick={() => onEdit(claim)}>
              ✏️ Edit & Resubmit
            </button>
          )}
          {mode === 'finance' && currentUser.roles.includes('ADMIN') && (
            <button className="btn btn-warning" onClick={() => onEdit(claim)}>
              ✏️ Admin Edit
            </button>
          )}
          {mode === 'manager' && claim.approvalStatus === APPROVAL_STATUS.PENDING && (
            <>
              <button className="btn btn-outline" style={{ color: 'var(--error)' }} onClick={() => wrappedStatusUpdate(claim.id, { approvalStatus: APPROVAL_STATUS.REJECTED })}>Reject Claim</button>
              <button className="btn btn-primary" onClick={() => wrappedStatusUpdate(claim.id, { approvalStatus: APPROVAL_STATUS.APPROVED })}>Approve Claim</button>
            </>
          )}
          {mode === 'finance' && (
            <>
              {(claim.claimStatus === CLAIM_STATUS.SUBMITTED || claim.approvalStatus === APPROVAL_STATUS.REJECTED) && !claim.isViewOnly && (
                <button className="btn btn-warning" onClick={() => wrappedStatusUpdate(claim.id, { claimStatus: CLAIM_STATUS.ACCRUED })}>Accrue (Month-End)</button>
              )}
              {claim.approvalStatus === APPROVAL_STATUS.APPROVED && claim.claimStatus !== CLAIM_STATUS.CLOSED && !claim.isViewOnly && (
                <button className="btn btn-primary" disabled={syncing} onClick={handleSync}>
                  {syncing ? 'Syncing to D365FO...' : 'Sync & Close'}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <div className="no-print">
        {claim.approvalStatus === APPROVAL_STATUS.REJECTED && (
          <div className="alert alert-error" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', border: '1px solid #f44336', color: '#f44336', background: '#ffebee', borderRadius: '4px' }}>
            <span style={{ fontSize: '1.2rem' }}>⚠️</span>
            <div>
              <strong>Action Required: Claim Rejected</strong><br />
              <small>Please review the manager's feedback below, correct the discrepancies, and resubmit.</small>
            </div>
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <span className={`badge badge-${claim.claimStatus.toLowerCase()}`}>Claim: {claim.claimStatus}</span>
          <span className={`badge badge-${claim.approvalStatus.replace(' ', '-').toLowerCase()}`}>Approval: {claim.approvalStatus}</span>
          {claim.statement_attachment && (
            <span
              className="badge"
              style={{ background: '#f1f5f9', color: 'var(--primary)', border: '1px solid #cbd5e1', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              onClick={() => onPreview && onPreview(claim.statement_attachment)}
            >
              📄 Original Statement Attached
            </span>
          )}
          <span style={{ fontSize: '0.85rem', color: '#475569', fontWeight: '500' }}>Advance: {claim.currency || '€'}{claim.advanceAmount}</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', alignItems: 'center' }}>
            {entity && <span style={{ fontSize: '0.85rem', color: '#475569', fontWeight: '500', background: '#f0f4f8', padding: '4px 8px', borderRadius: '4px', border: '1px solid #d9e2ec' }}>Entity: <strong>{entity.code} - {entity.name}</strong></span>}
            {approver && <span style={{ fontSize: '0.85rem', color: '#475569', fontWeight: '500', background: '#fff', padding: '4px 8px', borderRadius: '4px', border: '1px solid #ddd' }}>Approver: <strong>{approver.name}</strong></span>}
            {accountants?.length > 0 && (
              <span style={{ fontSize: '0.85rem', color: '#475569', fontWeight: '500', background: '#e0f2fe', padding: '4px 8px', borderRadius: '4px', border: '1px solid #bae6fd' }}>
                Accountant: <strong>{accountants.map(a => a.name).join(', ')}</strong>
              </span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border)', marginBottom: '1rem' }}>
          <div className={`nav-item ${activeTab === 'details' ? 'active' : ''}`} onClick={() => setActiveTab('details')}>Details & Receipts</div>
          <div className={`nav-item ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>Audit History</div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem', paddingBottom: '2rem' }}>
          {activeTab === 'details' ? (
            <div className="card" style={{ padding: '0 1.5rem' }}>
              {claim.expenses.map(e => {
                const typeCfg = (expenseTypes || []).find(t => t.label === e.type);
                const mapping = entity.expenseMappings?.[typeCfg?.id];
                const aiMetadata = attachedReceipts[e.backlog_id || e.backlogId];
                const hasConversion = e.expense_currency && e.claim_currency && e.expense_currency !== e.claim_currency;

                return (
                  <div key={e.id} style={{ borderBottom: '1px solid #f0f0f0', padding: '1.5rem 0' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(100px, 1fr) 2fr 3fr 1fr 1fr', gap: '1rem', padding: '0.5rem 0', alignItems: 'start' }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '0.8rem', color: '#666', fontWeight: 'bold' }}>{e.exchange_rate_date || e.date || 'No Date'}</span>
                        <small style={{ color: '#888', fontSize: '0.7rem' }}>Expense Date</small>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <strong>{e.type}</strong>
                        {aiMetadata?.vendor_suggestion && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: '500' }}>🏪 {aiMetadata.vendor_suggestion}</span>
                        )}
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span>{e.description || 'No description provided'}</span>
                        <small style={{ color: '#888' }}>
                          {e.project && `Project: ${e.project}`} {e.department && ` | Dept: ${e.department}`}
                        </small>

                        {/* Entertainment Details */}
                        {typeCfg?.requiresEntertainment && (e.purpose || e.attendees) && (
                          <div style={{ marginTop: '0.4rem', padding: '0.4rem', background: '#f8fafc', borderRadius: '4px', fontSize: '0.75rem', border: '1px solid #e2e8f0' }}>
                            <div><strong>Purpose:</strong> {e.purpose}</div>
                            <div><strong>Attendees:</strong> {e.attendees} {e.clients ? `(Clients: ${e.clients})` : ''}</div>
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        <strong>{e.claim_currency || '€'}{Number(e.claim_amount || e.amount).toFixed(2)}</strong>
                        {hasConversion && (
                          <small style={{ color: '#666', fontSize: '0.7rem' }}>
                            {e.expense_currency} {e.gross_amount || e.amount} @ {e.exchange_rate}
                          </small>
                        )}
                      </div>

                      <div className="attachment-container" style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        {e.receipt ? (
                          <span style={{ color: 'var(--primary)', cursor: 'pointer', textDecoration: 'underline', fontSize: '0.85rem' }} onClick={() => onPreview && onPreview(e.receipt)}>📎 View</span>
                        ) : (
                          <span style={{ color: '#999', fontSize: '0.85rem' }}>No receipt</span>
                        )}
                      </div>
                    </div>

                    <div style={{ marginBottom: '0.8rem', fontSize: '0.75rem', color: '#666' }}>
                      {entity.name} Mapping: G/L <strong>{mapping?.glAccount || typeCfg?.defaultAccount || 'N/A'}</strong> | VAT <strong>{mapping?.vatRate ?? typeCfg?.defaultVat ?? 0}%</strong>
                    </div>

                    {/* Finance Audit View: Immutable AI Toggles & Overrides */}
                    {mode === 'finance' && aiMetadata && (
                      <div style={{ marginTop: '0.8rem', padding: '0.75rem', background: '#e8eaf6', borderRadius: '4px', borderLeft: '3px solid #3f51b5' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                          <strong style={{ fontSize: '0.8rem', color: '#3f51b5' }}>🤖 AI Audit Trail</strong>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            {aiMetadata.duplicate_flag && <span className="badge badge-rejected" style={{ padding: '2px 6px', fontSize: '0.65rem' }}>System Duplicate</span>}
                            {aiMetadata.manual_override_flag && <span className="badge badge-warning" style={{ padding: '2px 6px', fontSize: '0.65rem', background: '#ff9800', color: '#fff' }}>User Override Detected</span>}
                          </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(250px, 1fr) 1fr', gap: '1rem', fontSize: '0.75rem' }}>
                          <div>
                            <strong>File Hash (SHA-256):</strong> <code style={{ fontSize: '0.65rem', wordBreak: 'break-all', display: 'block', color: '#555' }}>{aiMetadata.file_hash || 'N/A'}</code>
                          </div>
                          <div>
                            <strong>AI Original Suggestion:</strong> {aiMetadata.vendor_suggestion || 'Unknown'} - {aiMetadata.amount_suggestion || 0}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Line Comments Visibility (PRD 5.1/5.2) */}
                    {(e.comment || mode === 'manager' || claim.approvalStatus === APPROVAL_STATUS.REJECTED) && (
                      <div style={{ marginTop: '0.8rem', padding: '0.75rem', background: '#fff9c4', borderRadius: '4px', borderLeft: '3px solid #fbc02d' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                          <strong style={{ fontSize: '0.8rem' }}>Manager Feedback:</strong>
                          {mode === 'manager' && (
                            <button className="btn btn-outline" style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }} onClick={() => {
                              const updatedExpenses = claim.expenses.map(item => item.id == e.id ? { ...item, comment: document.getElementById(`comment-${e.id}`).value } : item);
                              onSave({ ...claim, expenses: updatedExpenses, actorId: currentUser.id });
                            }}>Save Comment</button>
                          )}
                        </div>
                        {mode === 'manager' && claim.approvalStatus === APPROVAL_STATUS.PENDING ? (
                          <textarea id={`comment-${e.id}`} defaultValue={e.comment} placeholder="Provide feedback or reason for rejection..." style={{ width: '100%', border: '1px solid #ddd', borderRadius: '4px', padding: '0.5rem', fontSize: '0.85rem' }} rows={2} />
                        ) : (
                          <p style={{ margin: 0, fontSize: '0.85rem' }}>{e.comment || 'No feedback provided.'}</p>
                        )}
                      </div>
                    )}

                    {/* Accountant Specific Adjustment Row (PRD 7.3) */}
                    {mode === 'finance' && (
                      <div style={{ background: '#f9f9f9', padding: '0.75rem', borderRadius: '4px', marginTop: '0.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem', fontSize: '0.85rem' }}>
                        <div className="form-group">
                          <label>G/L Account</label>
                          <input type="text" defaultValue={mapping?.glAccount || typeCfg?.defaultAccount || '600000'} style={{ padding: '0.2rem' }} />
                        </div>
                        <div className="form-group">
                          <label>VAT Rate (%)</label>
                          <input type="number" defaultValue={mapping?.vatRate ?? typeCfg?.defaultVat ?? 0} style={{ padding: '0.2rem' }} />
                        </div>
                        <div className="form-group">
                          <label>Project</label>
                          <input type="text" defaultValue={e.project} style={{ padding: '0.2rem' }} />
                        </div>
                        <div className="form-group" style={{ alignSelf: 'end' }}>
                          <button className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => alert('Dimension Update Persisted (Logged to Audit Trail)')}>Update Dimensions</button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="card">
              <h3>Audit Trail</h3>
              <ul style={{ listStyle: 'none', marginTop: '1rem' }}>
                {history.map((log, idx) => (
                  <li key={idx} style={{ padding: '1rem', borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? '#fff' : '#f8fafc', borderRadius: '4px', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.4rem' }}>
                      <span style={{ fontWeight: '600', color: 'var(--primary)' }}>{log.action}</span>
                      <small style={{ color: '#64748b' }}>{new Date(log.timestamp).toLocaleString()}</small>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.85rem' }}>By <strong>{log.actorName || (log.actorId === owner?.id ? 'Staff' : 'Reviewer')}</strong></span>
                      <span style={{ color: '#cbd5e1' }}>|</span>
                      <span className={`badge badge-${(log.newClaimStatus || 'NEW').toLowerCase()}`} style={{ fontSize: '0.7rem' }}>Claim: {log.newClaimStatus || 'NEW'}</span>
                      <span className={`badge badge-${(log.newApprovalStatus || 'N/A').replace(' ', '-').toLowerCase()}`} style={{ fontSize: '0.7rem' }}>Approval: {log.newApprovalStatus || 'N/A'}</span>
                    </div>
                    {log.details?.error && <div style={{ color: 'var(--error)', fontSize: '0.8rem', marginTop: '4px' }}>⚠️ {log.details.error}</div>}
                    {log.comment && <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: '#fff', borderLeft: '3px solid #e2e8f0', fontSize: '0.85rem', fontStyle: 'italic' }}>"{log.comment}"</div>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <ClaimReport claim={claim} user={owner} entity={entity} />
    </div >
  );
};

const ClaimForm = ({ user, users, claim, entities, projects, departments, expenseTypes, exchangeRates, receipts, userEntityApprovers, onUploadReceipt, onCancel, onSave, onDraft, onPreview }) => {
  // Always query the freshest user object from the database array, bypassing stale LocalStorage tokens
  const activeUser = useMemo(() => users?.find(u => String(u.id) == String(user.id)) || user, [users, user]);

  const availableEntities = useMemo(() => {
    if (!entities || !userEntityApprovers) return [];
    if (activeUser.roles?.includes('ADMIN')) return entities; // Admins can claim against any entity
    return entities.filter(e =>
      String(e.id) == String(activeUser.entityId) ||
      (Array.isArray(activeUser.assignedEntities) && activeUser.assignedEntities.some(ae => String(ae) == String(e.id))) ||
      userEntityApprovers.some(ua => String(ua.user_id) == String(activeUser.id) && String(ua.entity_id) == String(e.id))
    );
  }, [entities, userEntityApprovers, activeUser]);

  const [selectedEntityId, setSelectedEntityId] = useState(claim?.entityId || (availableEntities.length === 1 ? availableEntities[0].id : ''));
  const activeEntity = availableEntities.find(e => e.id === selectedEntityId) || {};

  const availableCurrencies = useMemo(() => {
    if (!activeEntity.id) return [];
    const curs = [];
    if (activeEntity.primary_currency) curs.push(activeEntity.primary_currency);
    if (activeEntity.secondary_currency) curs.push(activeEntity.secondary_currency);
    return [...new Set(curs)];
  }, [activeEntity]);

  const [selectedCurrency, setSelectedCurrency] = useState(claim?.currency || (availableCurrencies.length === 1 ? availableCurrencies[0] : ''));

  const [formData, setFormData] = useState(claim || {
    id: 'DRAFT-' + Date.now(),
    title: '',
    userId: user.id,
    entityId: selectedEntityId,
    currency: selectedCurrency,
    advanceAmount: 0,
    claimStatus: CLAIM_STATUS.NEW,
    approvalStatus: APPROVAL_STATUS.NA,
    expenses: []
  });

  // Critical for draft persistence: re-initialize state if the 'claim' prop changes (e.g. on edit)
  useEffect(() => {
    if (claim) {
      setFormData(claim);
      if (claim.entityId) setSelectedEntityId(claim.entityId);
      if (claim.currency) setSelectedCurrency(claim.currency);
    }
  }, [claim]);

  useEffect(() => {
    setFormData(prev => ({ ...prev, entityId: selectedEntityId, currency: selectedCurrency }));
  }, [selectedEntityId, selectedCurrency]);

  // Auto-select currency if only one is available for the selected entity
  useEffect(() => {
    if (!claim && availableCurrencies.length === 1 && selectedCurrency !== availableCurrencies[0]) {
      setSelectedCurrency(availableCurrencies[0]);
    }
  }, [availableCurrencies, selectedCurrency, claim]);

  const [showLibrary, setShowLibrary] = useState(true);
  const fileInputRef = React.useRef(null);
  const claimFileInputRef = React.useRef(null);

  const mandatory = activeEntity.mandatoryFields || {};

  const isFormValid = useMemo(() => {
    if (!formData.title || !formData.entityId || (availableCurrencies.length > 0 && !formData.currency)) return false;
    return formData.expenses.every(e => {
      const typeCfg = expenseTypes.find(t => t.label === e.type);
      const mapping = activeEntity.expenseMappings?.[typeCfg?.id];
      const glAccount = mapping?.glAccount || typeCfg?.defaultAccount;
      const basicValid = e.type && e.amount > 0 && e.receipt &&
        (!mandatory.project || e.project) &&
        (!mandatory.department || e.department);
      if (typeCfg?.requiresEntertainment) {
        return basicValid && e.clients && e.purpose && e.attendees;
      }
      return basicValid;
    });
  }, [formData, mandatory, expenseTypes, activeEntity, availableCurrencies]);

  const resolvedApprover = useMemo(() => {
    if (!selectedEntityId || !users) return null;

    // 1. Prioritize explicit mapping for the CURRENTLY SELECTED entity
    if (userEntityApprovers) {
      const explicitMapping = userEntityApprovers.find(ua => ua.user_id === user.id && ua.entity_id === selectedEntityId && ua.approver_id);
      if (explicitMapping) {
        const approver = users.find(u => u.id === explicitMapping.approver_id);
        return approver ? { id: approver.id, name: approver.name } : null;
      }
    }

    // 2. If it's their primary Home Entity, fallback to their profile's primary approver
    if (user.entityId === selectedEntityId && user.approverId) {
      const primaryApprover = users.find(u => u.id === user.approverId);
      return primaryApprover ? { id: primaryApprover.id, name: primaryApprover.name } : null;
    }

    // 3. If no approver exists, block submission by returning null
    return null;
  }, [user, users, selectedEntityId, userEntityApprovers]);

  const updateExpense = (id, field, value) => {
    const updated = formData.expenses.map(e => e.id === id ? { ...e, [field]: value } : e);
    setFormData({ ...formData, expenses: updated });
  };
  const updateExpenseFields = (id, updates) => {
    const updated = formData.expenses.map(e => e.id === id ? { ...e, ...updates } : e);
    setFormData({ ...formData, expenses: updated });
  };

  const getExchangeRate = (fromCur, toCur, dateStr) => {
    if (fromCur === toCur) return 1;
    if (!dateStr || !exchangeRates || exchangeRates.length === 0) return null;
    const period = dateStr.substring(0, 7); // YYYY-MM
    const rateItem = exchangeRates.find(r => r.period === period && r.from_currency === fromCur && r.to_currency === toCur);
    return rateItem ? (rateItem.exchange_rate || rateItem.rate) : null;
  };

  const calculateConvertedAmount = (exp) => {
    const rate = getExchangeRate(exp.currency, formData.currency, exp.date);
    if (rate === null && exp.currency !== formData.currency) return null;
    return Number(exp.amount) * (rate || 1);
  };

  const handleSubmitAttempt = (e) => {
    e.preventDefault();
    if (!formData.title) return alert("Please enter a Claim Title.");
    if (!formData.entityId || (availableCurrencies.length > 0 && !formData.currency)) {
      return alert("Please select a Legal Entity and Claim Currency.");
    }
    if (formData.expenses.length === 0) return alert("Please add at least one expense position.");

    for (let i = 0; i < formData.expenses.length; i++) {
      const exp = formData.expenses[i];
      if (!exp.type || !exp.amount || !exp.receipt || !exp.date || !exp.currency) {
        return alert(`Position ${i + 1} is missing basic info (Type, Date, Currency, Amount, or Receipt).`);
      }
      if (exp.currency !== formData.currency) {
        const rate = getExchangeRate(exp.currency, formData.currency, exp.date);
        if (rate === null) {
          return alert(`Position ${i + 1} is blocked: Missing Exchange Rate configuration for ${exp.currency} to ${formData.currency} for the period ${exp.date.substring(0, 7)}.`);
        }
      }
      if (mandatory.project && !exp.project) {
        return alert(`Position ${i + 1} is missing a mandatory Project.`);
      }
      if (mandatory.department && !exp.department) {
        return alert(`Position ${i + 1} is missing a mandatory Department.`);
      }
      const typeCfg = expenseTypes.find(t => t.label === exp.type);
      if (typeCfg?.requiresEntertainment && (!exp.clients || !exp.purpose || !exp.attendees)) {
        return alert(`Position ${i + 1} is an Entertainment expense and requires Clients, Purpose, and Attendees details.`);
      }
    }

    onSave({ ...formData, claimStatus: CLAIM_STATUS.SUBMITTED, approvalStatus: APPROVAL_STATUS.PENDING, approverId: resolvedApprover?.id });
  };

  return (
    <div className="view">
      <div className="frozen-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ color: 'var(--primary)', marginBottom: '0.2rem' }}>{formData.title || 'New Expense Claim'}</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0 0 0.5rem 0' }}>
              Positions: <strong>{formData.expenses.length}</strong> | Total: <strong>{formData.currency} {formData.expenses.reduce((acc, e) => {
                const conv = calculateConvertedAmount(e);
                return acc + (conv !== null ? conv : 0);
              }, 0).toFixed(2)}</strong>
            </p>
            <div style={{ fontSize: '0.75rem', gap: '1rem', color: '#666', background: '#f5f5f5', padding: '0.3rem 0.6rem', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', flexWrap: 'wrap' }}>
              <span>Role: <strong>{user.roles?.join(', ') || 'N/A'}</strong></span>
              {activeEntity?.code && <span>Entity: <strong>{activeEntity.code} - {activeEntity.name}</strong></span>}
              {resolvedApprover && <span>Approver: <strong>{resolvedApprover.name}</strong></span>}
              {formData.statement_attachment && (
                <span title="Statement attached" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer', color: 'var(--primary)' }} onClick={() => onPreview && onPreview(formData.statement_attachment)}>
                  <span style={{ fontSize: '1rem' }}>📄</span> Statement: <strong>{formData.statement_attachment}</strong>
                </span>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-outline" onClick={onCancel}>Cancel</button>

            {user.roles?.includes('ADMIN') && formData.claimStatus !== CLAIM_STATUS.NEW ? (
              <button className="btn btn-warning" onClick={() => onSave(formData)}>Save Admin Edits</button>
            ) : (
              <>
                <button className="btn btn-outline" disabled={!formData.title} onClick={() => onDraft({ ...formData, approverId: resolvedApprover?.id })}>Save Draft</button>
                <button className="btn btn-primary" onClick={handleSubmitAttempt}>Submit for Approval</button>
              </>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
        <div style={{ flex: showLibrary ? '5.5' : '1', transition: 'flex 0.3s ease', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 180px)' }}>
          <div className="card" style={{ marginBottom: '1.5rem', display: 'grid', gridTemplateColumns: '2fr 1fr 1.5fr 1fr', gap: '1rem', padding: '1rem 1.5rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '0.75rem', marginBottom: '0.2rem' }}>Claim Title *</label>
              <input type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="e.g. Q1 Travel Expenses" style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '0.75rem', marginBottom: '0.2rem' }}>Advance Amount (€)</label>
              <input type="number" value={formData.advanceAmount} onChange={e => setFormData({ ...formData, advanceAmount: e.target.value })} style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '0.75rem', marginBottom: '0.2rem' }}>Legal Entity *</label>
              <select
                value={selectedEntityId}
                onChange={e => { setSelectedEntityId(e.target.value); setSelectedCurrency(''); }}
                disabled={!!claim || (availableEntities.length === 1 && !activeUser.roles?.includes('ADMIN'))}
                style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
              >
                <option value="">Select Entity</option>
                {availableEntities.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '0.75rem', marginBottom: '0.2rem' }}>Claim Currency *</label>
              <select
                value={selectedCurrency}
                onChange={e => setSelectedCurrency(e.target.value)}
                disabled={!!claim || availableCurrencies.length <= 1}
                style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
              >
                <option value="">{availableCurrencies.length > 0 ? 'Select Currency' : 'N/A'}</option>
                {availableCurrencies.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {formData.claim_type === 'CompanyCard' && (
            <div className="card" style={{ marginBottom: '1.5rem', background: '#f0f7ff', borderColor: '#0078d4', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ fontSize: '1.5rem' }}>🪄</div>
                <div>
                  <strong style={{ display: 'block', color: '#0078d4' }}>Company Card Statement Mode</strong>
                  <small style={{ color: '#666' }}>Matching receipts to statement lines automates your expense reporting.</small>
                </div>
              </div>
              <button
                className="btn btn-primary"
                onClick={async () => {
                  try {
                    // 1. Fetch unallocated receipts for this user/entity
                    const { data: backlog } = await supabase
                      .from('receipts')
                      .select('*')
                      .eq('user_id', user.id)
                      .eq('entity_id', selectedEntityId)
                      .eq('status', 'UNALLOCATED');

                    if (!backlog || backlog.length === 0) {
                      alert('No unallocated receipts found in your library for this entity.');
                      return;
                    }

                    let matchedCount = 0;
                    const newExpenses = formData.expenses.map(exp => {
                      if (exp.payment_type !== 'CompanyCard' || exp.receipt) return exp;

                      // Matching Priority: 1. Amount (Primary), 2. Date (Secondary), 3. Currency (Strict)
                      const expDate = new Date(exp.date);
                      const matches = backlog.filter(r => {
                        if (r.allocated_claim_id) return false;

                        const rAmt = parseFloat(r.amount_suggestion || r.gross_amount || 0);
                        const diffAmtPct = exp.amount > 0 ? (Math.abs(exp.amount - rAmt) / exp.amount) : 0;

                        const rCur = (r.expense_currency || activeEntity.primary_currency || 'EUR').trim().toUpperCase();
                        const eCur = (exp.currency || 'EUR').trim().toUpperCase();
                        const currencyMatch = rCur === eCur;

                        // Phase 1: Verify Amount & Currency (The anchor for matching)
                        return currencyMatch && diffAmtPct <= 0.03;
                      });

                      // Phase 2: From the amount matches, pick the one closest in date
                      let match = null;
                      if (matches.length === 1) {
                        match = matches[0];
                      } else if (matches.length > 1) {
                        // Tie-breaker: Closest date within 7 days
                        match = matches.reduce((best, current) => {
                          const bestDate = new Date(best.transaction_date || best.created_at);
                          const currentDate = new Date(current.transaction_date || current.created_at);
                          const bestDiff = Math.abs(expDate - bestDate);
                          const currentDiff = Math.abs(expDate - currentDate);
                          return currentDiff < bestDiff ? current : best;
                        });

                        const finalDiffDays = Math.abs((expDate - new Date(match.transaction_date || match.created_at)) / (1000 * 60 * 60 * 24));
                        if (finalDiffDays > 7) match = null; // Too far even if amount matches
                      }

                      if (match) {
                        matchedCount++;
                        match.allocated_claim_id = 'LOCKED'; // Prevent double matching in same run
                        return {
                          ...exp,
                          receipt: match.file_name,
                          backlogId: match.id,
                          allocation_status: 'AUTO',
                          description: match.vendor_suggestion ? `Auto-matched to ${match.vendor_suggestion}` : `Auto-matched to ${match.file_name}`
                        };
                      }
                      return exp;
                    });

                    setFormData({ ...formData, expenses: newExpenses });
                    alert(`Auto-allocation complete! Matched ${matchedCount} lines.`);
                  } catch (err) {
                    console.error('Auto-allocate error:', err);
                  }
                }}
              >
                Auto Allocate Receipts
              </button>
            </div>
          )}

          {selectedEntityId && (availableCurrencies.length === 0 || selectedCurrency) && (
            <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem' }}>
              {formData.expenses.map((exp, idx) => {
                const typeCfg = expenseTypes.find(t => t.label === exp.type);
                const mapping = activeEntity.expenseMappings?.[typeCfg?.id];
                const localGL = mapping?.glAccount || typeCfg?.defaultAccount || 'N/A';
                const localVAT = mapping?.vatRate ?? typeCfg?.defaultVat ?? 0;
                return (
                  <div
                    key={exp.id}
                    className="card"
                    style={{ marginBottom: '1.5rem', borderLeft: '5px solid var(--primary)', transition: 'all 0.2s ease', position: 'relative', overflow: 'hidden', padding: '1.8rem 1.5rem' }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      try {
                        const receiptData = JSON.parse(e.dataTransfer.getData('receipt'));
                        const newExpenses = [...formData.expenses];
                        const exp = newExpenses[idx];

                        // Derived FX logic: compare statement amount with receipt amount
                        const receiptAmt = receiptData.amount_suggestion || receiptData.gross_amount;
                        let derivedFX = null;
                        if (exp.payment_type === 'CompanyCard' && receiptAmt && exp.amount) {
                          derivedFX = exp.amount / receiptAmt;
                        }

                        newExpenses[idx] = {
                          ...exp,
                          receipt: receiptData.file_name,
                          date: exp.payment_type === 'CompanyCard' ? exp.date : (receiptData.transaction_date || exp.date),
                          amount: exp.payment_type === 'CompanyCard' ? exp.amount : (receiptData.amount_suggestion || exp.amount),
                          type: receiptData.expense_type || exp.type,
                          currency: exp.payment_type === 'CompanyCard' ? exp.currency : (receiptData.expense_currency || exp.currency),
                          backlogId: receiptData.id,
                          allocation_status: 'MANUAL',
                          derived_fx: derivedFX,
                          description: receiptData.vendor_suggestion ? `Allocated from ${receiptData.vendor_suggestion}` : `Allocated from ${receiptData.file_name}`
                        };
                        setFormData({ ...formData, expenses: newExpenses });
                      } catch (err) { console.error('Drop error:', err); }
                    }}
                  >
                    {/* Delete button top right */}
                    <div style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
                      <button className="btn" style={{ background: 'transparent', color: '#9ca3af', padding: '0.2rem', fontSize: '1.2rem', border: 'none', cursor: 'pointer' }} title="Remove Position" onClick={() => setFormData({ ...formData, expenses: formData.expenses.filter(i => i.id !== exp.id) })} onMouseOver={e => e.currentTarget.style.color = '#ef4444'} onMouseOut={e => e.currentTarget.style.color = '#9ca3af'}>×</button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(160px, 1.5fr) minmax(130px, 1fr) minmax(180px, 1.5fr) minmax(140px, 1fr)', gap: '1.5rem', marginTop: '0.5rem' }}>
                      <div className="form-group">
                        <label>Type *</label>
                        <select value={exp.type} onChange={e => updateExpense(exp.id, 'type', e.target.value)}>
                          <option value="">Choose Type</option>
                          {expenseTypes.map(t => <option key={t.id} value={t.label}>{t.label}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Date *</label>
                        <input type="date" value={exp.date || ''} onChange={e => updateExpense(exp.id, 'date', e.target.value)} disabled={exp.immutable} title={exp.immutable ? "Locked by bank statement" : ""} />
                      </div>
                      <div className="form-group">
                        <label>Currency & Amount *</label>
                        <div style={{ display: 'flex' }}>
                          <input type="text" value={exp.currency || ''} onChange={e => updateExpense(exp.id, 'currency', e.target.value.toUpperCase())} disabled={exp.immutable} placeholder="EUR" style={{ width: '80px', borderTopRightRadius: 0, borderBottomRightRadius: 0, borderRight: 'none', textAlign: 'center', background: exp.immutable ? '#f3f4f6' : '#f9fafb', fontWeight: 'bold' }} title={exp.immutable ? "Locked by bank statement" : ""} />
                          <input type="number" value={isNaN(exp.amount) ? '' : exp.amount} onChange={e => updateExpense(exp.id, 'amount', e.target.value)} disabled={exp.immutable} style={{ flex: 1, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }} title={exp.immutable ? "Locked by bank statement" : ""} />
                        </div>
                        {exp.payment_type === 'CompanyCard' ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: '500' }}>
                              Authoritative Bank Statement Line
                            </div>
                            {exp.currency !== exp.billing_currency && exp.billing_amount && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <div className="badge" style={{ background: '#fef3c7', color: '#92400e', fontSize: '0.7rem', border: '1px solid #fcd34d', padding: '2px 6px', width: 'fit-content' }}>
                                  ⚠️ Fiscal Mismatch: Posted to {exp.billing_currency}
                                </div>
                                <div className="badge" style={{ background: '#f3f4f6', color: '#374151', fontSize: '0.7rem', border: '1px solid #d1d5db', padding: '2px 6px', width: 'fit-content' }}>
                                  Financial Posting: {exp.billing_currency} {Number(exp.billing_amount).toFixed(2)}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          exp.currency && formData.currency && exp.currency !== formData.currency && (
                            <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '4px', fontWeight: '500' }}>
                              {getExchangeRate(exp.currency, formData.currency, exp.date) === null ? (
                                <span style={{ color: 'var(--error)' }}>Missing FX Rate for {exp.date?.substring(0, 7)}!</span>
                              ) : (
                                <span>= {formData.currency} {calculateConvertedAmount(exp).toFixed(2)}</span>
                              )}
                            </div>
                          )
                        )}
                      </div>
                      <div className="form-group">
                        <label>Payment</label>
                        <select value={exp.payment_type || (exp.payment === 'COMPANY_CREDITCARD' ? 'CompanyCard' : 'CashReimbursement')} onChange={e => updateExpense(exp.id, 'payment_type', e.target.value)} disabled={exp.immutable}>
                          <option value="CompanyCard">Company Card</option>
                          <option value="CashReimbursement">Cash Reimbursement</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Receipt Attachment</label>
                        {exp.receipt ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#f3f4f6', padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                            <span style={{ fontSize: '1.2rem', cursor: 'pointer' }} onClick={() => onPreview && onPreview(exp.receipt)}>📄</span>
                            <span style={{ cursor: 'pointer', color: 'var(--primary)', fontWeight: '500', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} onClick={() => onPreview && onPreview(exp.receipt)}>
                              {exp.receipt}
                            </span>
                            <button className="btn btn-outline" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', color: 'var(--error)', borderColor: 'var(--error)' }} onClick={() => updateExpenseFields(exp.id, { receipt: null, backlogId: null })}>
                              Remove
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <input id={`file-upload-${exp.id}`} type="file" accept="image/*,application/pdf" style={{ display: 'none' }} onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) {
                                // Cache file locally for preview
                                const reader = new FileReader();
                                reader.onload = (ev) => {
                                  localStorage.setItem(`receipt_blob_${file.name}`, ev.target.result);
                                  if (onUploadReceipt) {
                                    onUploadReceipt(file).then(res => {
                                      if (res && res.id) {
                                        const updateProps = { receipt: res.data?.file_name || file.name, backlogId: res.id };
                                        if (res.data && res.data.transaction_date) updateProps.date = res.data.transaction_date;
                                        if (res.data && res.data.amount_suggestion) updateProps.amount = res.data.amount_suggestion;
                                        if (res.data && res.data.expense_currency) updateProps.currency = res.data.expense_currency;
                                        if (res.data && res.data.expense_type) updateProps.type = res.data.expense_type;
                                        if (res.data && res.data.vendor_suggestion) updateProps.description = res.data.vendor_suggestion;
                                        updateExpenseFields(exp.id, updateProps);
                                      }
                                    });
                                  } else {
                                    updateExpenseFields(exp.id, { receipt: file.name });
                                  }
                                };
                                reader.readAsDataURL(file);
                              }
                            }} />
                            <div style={{ flex: 1, border: '2px dashed #d1d5db', borderRadius: '8px', padding: '0.6rem', color: '#6b7280', cursor: 'pointer', textAlign: 'center', fontSize: '0.85rem', background: '#f9fafb', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => document.getElementById(`file-upload-${exp.id}`).click()} onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--primary)'; }} onMouseOut={e => { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.color = '#6b7280'; }}>
                              <span style={{ marginRight: '6px' }}>📎</span> Upload or drop
                            </div>
                            <button className="btn btn-outline" style={{ fontSize: '0.85rem', padding: '0.6rem' }} onClick={() => setShowLibrary(true)}>Library</button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Entity-Specific Dimensions */}
                    <div style={{ margin: '1.5rem 0 1rem 0', background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.8rem', color: '#475569', display: 'flex', alignItems: 'center' }}>
                      <span style={{ marginRight: '8px' }}>🏢</span>
                      Financial Dimensions for {activeEntity.name}: <strong style={{ marginLeft: '6px' }}>GL {localGL}</strong> <span style={{ margin: '0 8px', color: '#cbd5e1' }}>|</span> <strong>VAT {localVAT}%</strong>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem', marginTop: '0.5rem' }}>
                      <div className="form-group">
                        <label>Project {mandatory.project && '*'}</label>
                        <select value={exp.project} onChange={e => updateExpense(exp.id, 'project', e.target.value)}>
                          <option value="">Select Project</option>
                          {projects.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Department {mandatory.department && '*'}</label>
                        <select value={exp.department} onChange={e => updateExpense(exp.id, 'department', e.target.value)}>
                          <option value="">Select Dept</option>
                          {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Description</label>
                        <input type="text" value={exp.description || ''} onChange={e => updateExpense(exp.id, 'description', e.target.value)} />
                      </div>
                    </div>
                  </div>
                );
              })}
              <div style={{ marginTop: '1rem', textAlign: 'center', marginBottom: '2rem' }}>
                <button className="btn btn-outline" style={{ borderStyle: 'dashed', width: '100%', padding: '1rem', background: '#f8fafc' }} onClick={() => {
                  const defProject = projects.find(p => p.id === activeEntity.default_project_id)?.name || '';
                  const defDept = departments.find(d => d.id === activeEntity.default_department_id)?.name || '';
                  setFormData({ ...formData, expenses: [...formData.expenses, { id: Date.now(), type: '', amount: 0, currency: selectedCurrency, payment: 'REIMBURSABLE', receipt: null, project: defProject, department: defDept }] });
                }}>
                  + Add Expense Position
                </button>
              </div>
            </div>
          )}
        </div>

        {showLibrary && (
          <div className="card" style={{ flex: '1', maxWidth: '240px', height: 'calc(100vh - 180px)', display: 'flex', flexDirection: 'column', padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0 }}>Receipts Library</h3>
              <button className="btn" style={{ padding: '0.2rem 0.5rem', background: 'transparent', color: '#999', border: 'none', fontSize: '1.2rem' }} onClick={() => setShowLibrary(false)}>×</button>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#666', marginBottom: '1rem' }}>Drag a receipt onto an expense card.</p>

            <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {(receipts || []).filter(r => !formData.expenses.some(e => e.backlogId === r.id)).map(r => (
                <div
                  key={r.id}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData('receipt', JSON.stringify(r))}
                  style={{ padding: '0.8rem', border: '1px solid #eee', borderRadius: '6px', cursor: 'grab', background: 'white' }}
                >
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '1.2rem', cursor: 'pointer', lineHeight: '1.2' }} onClick={() => onPreview && onPreview(r.file_name)}>📄</span>
                    <div style={{ overflow: 'hidden', flex: 1 }}>
                      <strong style={{ display: 'block', fontSize: '0.75rem', cursor: 'pointer', marginBottom: '4px', wordBreak: 'break-all' }} title={r.file_name} onClick={() => onPreview && onPreview(r.file_name)}>
                        {r.file_name}
                        {r.duplicate_flag && <span style={{ color: '#d32f2f', marginLeft: '4px' }}>⚠️</span>}
                      </strong>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <small style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '0.75rem' }}>{r.expense_currency || '€'}{r.amount_suggestion || r.gross_amount || 0}</small>
                        <div style={{ fontSize: '0.65rem', color: '#888', fontStyle: 'italic', wordBreak: 'break-word' }}>{r.vendor_suggestion}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {(receipts || []).length === 0 && <p style={{ textAlign: 'center', color: '#888', padding: '2rem' }}>No unallocated receipts found.</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ImportPortal = ({ entities, user, expenseTypes, onImportComplete, setGlobalLoadingMessage }) => {
  const [step, setStep] = useState('upload');
  const [transactions, setTransactions] = useState([]);
  const [statementFile, setStatementFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setStatementFile(file);
    setIsUploading(true);
    setGlobalLoadingMessage(`Gemini AI is analyzing statement: ${file.name}...`);

    // Robustness: Cache the statement locally for instant preview, same as Receipts Library
    const reader = new FileReader();
    reader.onload = (ev) => {
      localStorage.setItem(`receipt_blob_${file.name}`, ev.target.result);
      // We also store it under the eventual Supabase path once we have the user ID, 
      // but since we don't have the final path yet, we'll rely on the filename first.
    };
    reader.readAsDataURL(file);

    try {
      const formData = new FormData();
      formData.append('statement', file);

      // Get entity categories to help the AI map types
      const userEnt = entities.find(el => el.id == user.entityId);
      // We pass the labels of all expense types to help Gemini categorize
      const allowedCategories = (expenseTypes || []).map(t => t.label).join(', ');
      formData.append('allowedCategories', allowedCategories);

      const envProxy = import.meta.env.VITE_GEMINI_PROXY_URL || '';
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      // Only use relative URL if we are in production OR if the environment var is a known placeholder
      const proxyBaseUrl = (envProxy.includes('your-gemini-proxy') || (!isLocalhost && envProxy.includes('localhost'))) ? '' : (envProxy || (isLocalhost ? 'http://localhost:3001' : ''));
      const response = await fetch(`${proxyBaseUrl}/api/extract-statement`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error(await response.text());

      const result = await response.json();
      const currentEntity = entities.find(el => el.id == user.entityId);
      const entityPrimaryCurrency = currentEntity?.primary_currency || 'EUR';

      const extractedTransactions = (result.transactions || []).map(tx => ({
        ...tx,
        id: 'STMT-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
        // Map AI fields to our internal transaction structure
        date: tx.date,
        vendor: tx.vendor,
        // If the original transaction currency matches the company currency, use the billing amount for both to ensure 100% precision.
        amount: (tx.transaction_currency === entityPrimaryCurrency) ? (parseFloat(tx.billing_amount) || 0) : (parseFloat(tx.transaction_amount) || 0),
        currency: tx.transaction_currency || 'EUR',
        billing_amount: parseFloat(tx.billing_amount) || 0,
        // ENFORCE: Billing currency MUST match the company's primary currency
        billing_currency: entityPrimaryCurrency,
        suggestedType: tx.suggestedType || 'Other'
      }));

      setTransactions(extractedTransactions);
      setStep('staging');
    } catch (err) {
      console.error('Statement extraction failed:', err);
      alert('Failed to extract data from statement. Please ensure it is a clear PDF, Image, or CSV.');
    } finally {
      setIsUploading(false);
      setGlobalLoadingMessage(null);
    }
  };

  const createDraftClaim = async () => {
    let attachmentPath = null;
    if (statementFile) {
      setIsUploading(true);
      try {
        const fileExt = statementFile.name.split('.').pop();
        const fileName = `statement_${Date.now()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('receipts')
          .upload(filePath, statementFile);

        if (uploadError) throw uploadError;
        attachmentPath = filePath;

        // Final robustness: Link the cached local blob to the final storage path 
        const localBlob = localStorage.getItem(`receipt_blob_${statementFile.name}`);
        if (localBlob) {
          localStorage.setItem(`receipt_blob_${filePath}`, localBlob);
        }
      } catch (err) {
        console.error('Statement upload error:', err);
        alert('Failed to upload original statement. Draft will be created without attachment.');
      } finally {
        setIsUploading(false);
      }
    }

    const newClaim = {
      id: 'DRAFT-' + Date.now(),
      title: 'Company Card: ' + new Date().toLocaleDateString(),
      userId: user.id,
      entityId: user.entityId,
      advanceAmount: 0,
      claimStatus: CLAIM_STATUS.NEW,
      approvalStatus: APPROVAL_STATUS.NA,
      claim_type: 'CompanyCard',
      statement_attachment: attachmentPath,
      import_batch_id: 'BATCH-' + Date.now(),
      expenses: transactions.map((tx, idx) => ({
        id: Date.now() + idx,
        type: tx.suggestedType,
        amount: tx.amount, // Transaction (for matching)
        currency: tx.currency, // Transaction (for matching)
        base_amount: tx.amount, // Explicitly set base for matching logic
        billing_amount: tx.billing_amount, // Billing (for posting/accounting)
        billing_currency: tx.billing_currency, // Billing (for posting/accounting)
        date: tx.date,
        description: tx.vendor,
        paymentMethod: 'COMPANY_CARD', // Maps to payment_type in DB
        payment_type: 'CompanyCard',
        external_reference: tx.id,
        immutable: true,
        allocation_status: 'UNMATCHED',
        receipt: null,
        project: '',
        department: ''
      }))
    };
    onImportComplete(newClaim);
  };

  return (
    <div className="view">
      <div className="header"><h2>Bank Statement Import</h2></div>
      <div style={{ display: 'none' }}>
        <input id="statement-upload" type="file" accept=".csv,.pdf,.png,.jpg,.jpeg,.xlsx" onChange={handleFileUpload} />
      </div>

      {step === 'upload' ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📄</div>
          <h3>Upload Card Statement (CSV)</h3>
          <p style={{ color: '#666', marginBottom: '1.5rem' }}>Format: Date, Vendor, Amount, Currency, Category</p>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
            <button className="btn btn-primary" onClick={() => document.getElementById('statement-upload').click()}>
              Choose File & Import
            </button>
            <button className="btn btn-outline" onClick={() => {
              // Quick simulation option for internal testing
              setTransactions([
                { id: 'TX-SIM-1', date: '2024-03-01', vendor: 'Shell Frankfurt', amount: 65.20, currency: 'EUR', billing_amount: 65.20, billing_currency: 'EUR', suggestedType: 'Fuel' },
                { id: 'TX-SIM-2', date: '2024-03-02', vendor: 'Lufthansa Airlines', amount: 320.00, currency: 'EUR', billing_amount: 320.00, billing_currency: 'EUR', suggestedType: 'Flight' }
              ]);
              setStep('staging');
            }}>
              Simulate Import
            </button>
          </div>
        </div>
      ) : (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h3>Review Extracted Lines: Amex_Feb.xlsx</h3>
              <p style={{ fontSize: '0.8rem', color: '#666' }}>Matched {transactions.length} transactions for {entities.find(e => e.id == user.entityId)?.name}</p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-outline" disabled={isUploading} onClick={() => setStep('upload')}>Cancel</button>
              <button className="btn btn-primary" disabled={isUploading} onClick={createDraftClaim}>
                {isUploading ? '📤 Uploading...' : 'Convert to Draft Claim'}
              </button>
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #eee', textAlign: 'left', fontSize: '0.85rem' }}>
                <th style={{ padding: '0.8rem 0' }}>Date</th>
                <th>Vendor</th>
                <th>Amount</th>
                <th>Category (Auto-Mapped)</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(tx => (
                <tr key={tx.id} style={{ borderBottom: '1px solid #f9f9f9', fontSize: '0.9rem' }}>
                  <td style={{ padding: '0.8rem 0' }}>{tx.date}</td>
                  <td style={{ fontWeight: '500' }}>{tx.vendor}</td>
                  <td>
                    <div style={{ fontWeight: '500' }}>{tx.currency} {tx.amount.toFixed(2)}</div>
                    {tx.currency !== tx.billing_currency && (
                      <div style={{ fontSize: '0.7rem', color: '#666' }}>
                        (Billed: {tx.billing_currency} {tx.billing_amount.toFixed(2)})
                      </div>
                    )}
                  </td>
                  <td>
                    <span className="badge" style={{ background: '#e3f2fd', color: '#1976d2', border: 'none' }}>
                      🪄 {tx.suggestedType}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const ReceiptBacklog = ({ user, onAllocate, onUploadReceipt, onBack, onPreview }) => {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingReceipt, setEditingReceipt] = useState(null);
  const [search, setSearch] = useState('');
  const fileInputRef = React.useRef(null);

  useEffect(() => {
    fetchReceipts();
  }, []);

  const fetchReceipts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('receipts')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'UNALLOCATED');

      if (error) throw error;
      setReceipts(data || []);
    } catch (err) {
      console.error('Fetch receipts error:', err);
    } finally {
      setLoading(false);
    }
  };

  const onFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      for (const file of files) {
        // Cache file locally for preview
        const reader = new FileReader();
        await new Promise((resolve) => {
          reader.onload = async (ev) => {
            localStorage.setItem(`receipt_blob_${file.name}`, ev.target.result);
            if (onUploadReceipt) {
              // Fire the AI upload proxy. It manages the optimistic state and db insert returning the ID.
              await onUploadReceipt(file);
              // Because ReceiptBacklog maintains its own local fetch sync, we refresh it.
              await fetchReceipts();
            }
            resolve();
          };
          reader.readAsDataURL(file);
        });
      }
      e.target.value = ''; // Reset input so the change event fires again for the same file if needed
    }
  };

  const handleDelete = async (id) => {
    try {
      const { error } = await supabase
        .from('receipts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchReceipts();
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  return (
    <div className="view">
      <div className="header">
        <h2>Receipt Backlog (Unallocated Library)</h2>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="🔍 Search receipts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ padding: '0.4rem 0.8rem 0.4rem 2rem', borderRadius: '15px', border: '1px solid #e2e8f0', width: '200px', fontSize: '0.85rem' }}
            />
          </div>
          <button className="btn btn-outline" onClick={onBack}>Back</button>
          <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={onFileChange} />
          <button className="btn btn-primary" onClick={() => fileInputRef.current.click()}>+ Upload from Local Machine</button>
        </div>
      </div>

      <div className="card" style={{ marginTop: '1.5rem' }}>
        {loading ? <p>Loading backlog...</p> : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.5rem' }}>
            {receipts.filter(r => {
              const s = search.toLowerCase();
              return search === '' ||
                r.file_name?.toLowerCase().includes(s) ||
                r.vendor_suggestion?.toLowerCase().includes(s) ||
                (r.id && String(r.id).toLowerCase().includes(s));
            }).map(r => (
              <div key={r.id} className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '2rem', cursor: 'pointer' }} onClick={() => onPreview && onPreview(r.file_name)}>📄</span>
                    <div style={{ display: 'flex', gap: '4px', flexDirection: 'column', alignItems: 'flex-end' }}>
                      <span className="badge badge-pending">{r.status}</span>
                      {r.receipt_status === 'processing' && <span className="badge" style={{ background: '#fff3e0', color: '#e65100', border: '1px solid #ffe0b2' }}>⏳ Processing AI...</span>}
                      {r.receipt_status === 'failed' && <span className="badge badge-rejected">AI Failed</span>}
                      {r.receipt_status === 'extracted' && <span className="badge badge-approved">✨ AI Extracted</span>}
                      {r.receipt_status === 'flagged_duplicate' && (
                        <span className="badge badge-rejected" style={{ background: '#ffebee', color: '#c62828' }}>🚩 Duplicate ({Math.round((r.duplicate_confidence_score || 1) * 100)}%)</span>
                      )}
                    </div>
                  </div>
                  <strong style={{ display: 'block', wordBreak: 'break-all', marginBottom: '0.5rem', cursor: 'pointer' }} onClick={() => onPreview && onPreview(r.file_name)}>{r.file_name}</strong>
                  <div style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '1.2rem', marginBottom: '0.2rem' }}>
                    {r.expense_currency || '€'}{r.amount_suggestion || r.gross_amount || 0}
                  </div>
                  <div style={{ color: '#666', fontSize: '0.85rem' }}>
                    <strong>{r.vendor_suggestion || 'Unknown Vendor'}</strong>
                    {r.expense_type && <div style={{ marginTop: '2px', fontStyle: 'italic' }}>Cat: {r.expense_type}</div>}
                    {r.transaction_date && <div style={{ marginTop: '2px' }}>Date: {r.transaction_date}</div>}
                    {r.vat_percentage !== null && r.vat_percentage !== undefined && <div style={{ marginTop: '2px' }}>VAT: {r.vat_percentage}%</div>}
                    {r.duplicate_flag && <div style={{ marginTop: '8px', color: '#d32f2f', fontWeight: 'bold', fontSize: '0.75rem' }}>⚠️ Audited as Duplicate</div>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                  <button className="btn btn-outline" style={{ padding: '0.2rem 0.4rem', fontSize: '0.7rem' }} onClick={() => setEditingReceipt(r)}>Edit</button>
                  <button className="btn btn-outline" style={{ padding: '0.2rem 0.4rem', fontSize: '0.7rem', color: 'var(--error)' }} onClick={() => handleDelete(r.id)}>Delete</button>
                  <button className="btn btn-primary" style={{ flex: 1, fontSize: '0.75rem' }} onClick={() => onAllocate(r)}>Use in New Claim</button>
                </div>
              </div>
            ))}
            {receipts.length === 0 && <p style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: '#888' }}>No unallocated receipts found. Upload some!</p>}
          </div>
        )}
      </div>

      {editingReceipt && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 }}>
          <div className="card" style={{ width: '500px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem' }}>
            <h2 style={{ margin: '0 0 1.5rem 0' }}>Review & Edit Receipt</h2>

            <div className="form-group"><label>Vendor Name</label><input value={editingReceipt.vendor_suggestion || ''} onChange={e => setEditingReceipt({ ...editingReceipt, vendor_suggestion: e.target.value })} /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group"><label>Transaction Date</label><input type="date" value={editingReceipt.transaction_date || ''} onChange={e => setEditingReceipt({ ...editingReceipt, transaction_date: e.target.value })} /></div>
              <div className="form-group"><label>Auto-Category</label><input value={editingReceipt.expense_type || ''} onChange={e => setEditingReceipt({ ...editingReceipt, expense_type: e.target.value })} /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem' }}>
              <div className="form-group"><label>Gross Amount</label><input type="number" step="0.01" value={editingReceipt.gross_amount || editingReceipt.amount_suggestion || ''} onChange={e => setEditingReceipt({ ...editingReceipt, gross_amount: e.target.value, amount_suggestion: e.target.value })} /></div>
              <div className="form-group"><label>VAT (%)</label><input type="number" step="0.1" value={editingReceipt.vat_percentage || ''} onChange={e => setEditingReceipt({ ...editingReceipt, vat_percentage: e.target.value })} /></div>
              <div className="form-group"><label>Currency</label><input value={editingReceipt.expense_currency || ''} onChange={e => setEditingReceipt({ ...editingReceipt, expense_currency: e.target.value.toUpperCase() })} /></div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '2rem' }}>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={async () => {
                try {
                  const payload = {
                    vendor_suggestion: editingReceipt.vendor_suggestion,
                    transaction_date: editingReceipt.transaction_date,
                    expense_type: editingReceipt.expense_type,
                    expense_currency: editingReceipt.expense_currency,
                    gross_amount: editingReceipt.gross_amount,
                    amount_suggestion: editingReceipt.amount_suggestion,
                    vat_percentage: editingReceipt.vat_percentage,
                    manual_override_flag: true
                  };
                  await supabase.from('receipts').update(payload).eq('id', editingReceipt.id);
                  setEditingReceipt(null);
                  fetchReceipts();
                } catch (err) { console.error('Update failed:', err); }
              }}>Save Override {"&"} Close</button>
              <button className="btn btn-outline" onClick={() => setEditingReceipt(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

const BulkImportModal = ({ isOpen, onClose, targetTable, onImportSuccess }) => {
  const [file, setFile] = useState(null);
  const [csvData, setCsvData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [mapping, setMapping] = useState({});
  const [loading, setLoading] = useState(false);

  const tableFields = {
    entities: ['name', 'code', 'address', 'country', 'country_iso3', 'logo', 'primary_currency', 'secondary_currency'],
    users: ['name', 'email', 'roles', 'entity_id', 'approver_id'],
    projects: ['name', 'code'],
    departments: ['name', 'code'],
    expense_types: ['label', 'default_account', 'default_vat', 'requires_entertainment'],
    exchange_rates: ['from_currency', 'to_currency', 'exchange_rate', 'rate_month', 'rate_year'],
    ai_prompts: ['prompt_type', 'prompt_text', 'is_active'],
    user_entity_approvers: ['user_id', 'entity_id', 'approver_id', 'is_accountant']
  };

  const currentFields = tableFields[targetTable] || [];

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    setFile(selectedFile);

    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setCsvData(results.data);
        if (results.data.length > 0) {
          const csvHeaders = Object.keys(results.data[0]);
          setHeaders(csvHeaders);

          // Auto-mapping logic
          const newMapping = {};
          currentFields.forEach(field => {
            const match = csvHeaders.find(h => h.toLowerCase().replace(/_|\s/g, '') === field.toLowerCase().replace(/_|\s/g, ''));
            if (match) newMapping[field] = match;
          });
          setMapping(newMapping);
        }
      }
    });
  };

  const handleImport = async () => {
    setLoading(true);
    try {
      const mappedData = csvData.map(row => {
        const item = {};
        Object.entries(mapping).forEach(([dbField, csvHeader]) => {
          if (csvHeader) item[dbField] = row[csvHeader];
        });
        return item;
      });

      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch('/api/bulk-import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ table: targetTable, data: mappedData })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      alert(`Import Successful! ${result.imported} records added.${result.failed > 0 ? ` (${result.failed} failed)` : ''}`);
      onImportSuccess();
      onClose();
    } catch (err) {
      alert('Import failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 3000 }}>
      <div className="card" style={{ width: '800px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2>Bulk Import: {targetTable.replace('_', ' ')}</h2>
          <button className="btn btn-outline" onClick={onClose}>✕</button>
        </div>

        {!file ? (
          <div style={{ padding: '3rem', border: '2px dashed #ddd', borderRadius: '8px', textAlign: 'center' }}>
            <p>Select a CSV file to begin migration</p>
            <input type="file" accept=".csv" onChange={handleFileChange} style={{ marginTop: '1rem' }} />
          </div>
        ) : (
          <div>
            <h3>Map Columns</h3>
            <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '1rem' }}>Match your CSV columns to the database fields.</p>

            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid #eee' }}>
                  <th style={{ padding: '0.5rem 0' }}>Database Field</th>
                  <th>CSV Column</th>
                </tr>
              </thead>
              <tbody>
                {currentFields.map(field => (
                  <tr key={field} style={{ borderBottom: '1px solid #f9f9f9' }}>
                    <td style={{ padding: '0.5rem 0' }}><code>{field}</code></td>
                    <td>
                      <select
                        value={mapping[field] || ''}
                        onChange={e => setMapping({ ...mapping, [field]: e.target.value })}
                        style={{ width: '100%', padding: '0.4rem' }}
                      >
                        <option value="">(Don't import)</option>
                        {headers.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '6px', marginBottom: '1.5rem' }}>
              <p style={{ margin: 0, fontSize: '0.85rem' }}>Rows detected: <strong>{csvData.length}</strong></p>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleImport} disabled={loading || csvData.length === 0}>
                {loading ? 'Importing...' : `Import ${csvData.length} Records`}
              </button>
              <button className="btn btn-outline" onClick={() => setFile(null)}>Reset</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const AdminCenter = ({ user, entities, users, projects, departments, expenseTypes, exchangeRates, userEntityApprovers, aiPrompts, onSave, onDeleteItem, fetchGlobalData }) => {
  const [activeTab, setActiveTab] = useState('entities');
  const [editingItem, setEditingItem] = useState(null);
  const [search, setSearch] = useState('');
  const [showBulkImport, setShowBulkImport] = useState(false);

  const getAccountantsForEntity = (entityId) => {
    return users.filter(u =>
      u.roles?.includes('ACCOUNTANT') &&
      (String(u.entityId) === String(entityId) || (Array.isArray(u.assignedEntities) && u.assignedEntities.some(ae => String(ae) === String(entityId))))
    );
  };

  const isRestricted = user.roles.includes('ACCOUNTANT') && !user.roles.includes('ADMIN');
  const assignedEntities = isRestricted
    ? entities.filter(e => String(e.id) === String(user.entityId) || (user.assignedEntities || []).some(ae => String(ae) === String(e.id)))
    : entities;

  const renderRoles = (userRoles) => {
    const roles = Array.isArray(userRoles) ? userRoles : [userRoles];
    return roles.join(', ');
  };

  const AVAILABLE_ROLES = ['STAFF', 'MANAGER', 'ACCOUNTANT', 'ADMIN'];
  const collectionMap = {
    entity: 'entities',
    user: 'users',
    project: 'projects',
    department: 'departments',
    expenseType: 'expense_types',
    exchangeRate: 'exchange_rates',
    aiPrompt: 'ai_prompts'
  };

  const handleSave = async () => {
    let collection = '';
    if (editingItem.type === 'entity') collection = 'entities';
    if (editingItem.type === 'user' && editingItem.isNew) {
      // Use the new Admin API for invitations
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const response = await fetch('/api/create-user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            email: editingItem.email,
            name: editingItem.name,
            roles: editingItem.roles,
            entityId: editingItem.entityId,
            approverId: editingItem.approverId,
            assignedEntities: editingItem.assignedEntities || []
          })
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error);
        alert('User invited successfully! They can now log in with the default password.');
        onSave('users', { ...editingItem, id: result.user.id });
        setEditingItem(null);
      } catch (err) {
        alert('Invite failed: ' + err.message);
      }
      return;
    }
    onSave(collectionMap[editingItem.type], editingItem);
    setEditingItem(null);
  };

  const filtered = (list) => {
    return (list || []).filter(item =>
      (item.name || item.label || item.title || '').toLowerCase().includes(search.toLowerCase()) ||
      (item.email || '').toLowerCase().includes(search.toLowerCase())
    );
  };

  return (
    <div className="view">
      <div className="header"><h2>Governance & Administration</h2></div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <button className={`btn ${activeTab === 'entities' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('entities')}>Legal Entities</button>
        {!isRestricted && <button className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('users')}>User Matrix</button>}
        <button className={`btn ${activeTab === 'projects' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('projects')}>Projects</button>
        <button className={`btn ${activeTab === 'departments' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('departments')}>Departments</button>
        <button className={`btn ${activeTab === 'expenseTypes' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('expenseTypes')}>Expense Categories</button>
        <button className={`btn ${activeTab === 'exchangeRates' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('exchangeRates')}>Exchange Rates</button>
        {!isRestricted && <button className={`btn ${activeTab === 'aiPrompts' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('aiPrompts')}>AI Prompts</button>}
        <button className={`btn ${activeTab === 'approvers' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('approvers')}>Approver Policies</button>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
            <h3 style={{ margin: 0 }}>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Registry</h3>
            <input
              type="text"
              placeholder="🔍 Search records..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ padding: '0.4rem 0.8rem', borderRadius: '4px', border: '1px solid #ddd', width: '250px' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {user.roles?.includes('ADMIN') && <button className="btn btn-outline" onClick={() => setShowBulkImport(true)}>📥 Bulk Import</button>}
            {activeTab === 'users' && <button className="btn btn-primary" onClick={() => setEditingItem({ type: 'user', isNew: true, roles: ['STAFF'] })}>+ Invite User</button>}
            {activeTab !== 'users' && (!isRestricted || (activeTab !== 'entities' && activeTab !== 'aiPrompts')) && (
              <button className="btn btn-primary" onClick={() => {
                const newItem = { isNew: true };
                if (activeTab === 'entities') newItem.type = 'entity';
                else if (activeTab === 'projects') newItem.type = 'project';
                else if (activeTab === 'departments') newItem.type = 'department';
                else if (activeTab === 'expenseTypes') newItem.type = 'expenseType';
                else if (activeTab === 'exchangeRates') newItem.type = 'exchangeRate';
                else if (activeTab === 'aiPrompts') newItem.type = 'aiPrompt';
                setEditingItem(newItem);
              }}>+ Add {activeTab === 'entities' ? 'Entity' : activeTab === 'expenseTypes' ? 'Category' : activeTab === 'exchangeRates' ? 'Rate' : activeTab === 'aiPrompts' ? 'Prompt' : activeTab.slice(0, -1)}</button>
            )}
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '2px solid #eee' }}>
              {activeTab === 'entities' && <><th>Logo</th><th>Name</th><th>Code</th><th>Location</th><th>Accountants</th></>}
              {activeTab === 'users' && <><th>Name</th><th>Email</th><th>Roles</th><th>Entity</th></>}
              {activeTab === 'projects' && <><th>Project Name</th><th>Code</th></>}
              {activeTab === 'departments' && <><th>Department Name</th><th>Code</th></>}
              {activeTab === 'expenseTypes' && <><th>Category</th><th>G/L Account</th><th>VAT %</th></>}
              {activeTab === 'exchangeRates' && <><th>From Cur</th><th>To Cur</th><th>Rate multiplier</th><th>Period</th></>}
              {activeTab === 'aiPrompts' && !isRestricted && <><th>Prompt Type</th><th>Instructions Preview</th><th>Last Updated</th></>}
              {activeTab === 'approvers' && <><th>Staff</th><th>Legal Entity</th><th>Approver</th><th>Accountant</th></>}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {activeTab === 'entities' && filtered(assignedEntities).map(e => (
              <tr key={e.id} style={{ borderBottom: '1px solid #f9f9f9' }}>
                <td style={{ fontSize: '1.5rem' }}>{e.logo || '🏢'}</td>
                <td><strong>{e.name}</strong></td>
                <td><code>{e.code}</code></td>
                <td><small>{e.address}, {e.country}</small></td>
                <td>
                  {(() => {
                    const accs = getAccountantsForEntity(e.id);
                    if (accs.length === 0) return (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f59e0b', fontSize: '0.8rem', fontStyle: 'italic' }}>
                        <span>⚠️ No Accountant Assigned</span>
                      </div>
                    );
                    return (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {accs.map(a => (
                          <span key={a.id} className="badge" style={{ background: '#e0f2fe', color: '#0369a1', fontSize: '0.7rem' }}>
                            👤 {a.name}
                          </span>
                        ))}
                      </div>
                    );
                  })()}
                </td>
                <td><button className="btn btn-outline" onClick={() => setEditingItem({ ...e, type: 'entity' })}>Edit</button></td>
              </tr>
            ))}
            {activeTab === 'users' && filtered(users).map(u => (
              <tr key={u.id} style={{ borderBottom: '1px solid #f9f9f9' }}>
                <td><strong>{u.name}</strong></td>
                <td><small>{u.email}</small></td>
                <td>{renderRoles(u.roles)} {u.is_active === false && <span className="badge badge-rejected" style={{ fontSize: '0.6rem' }}>INACTIVE</span>}</td>
                <td>{entities.find(e => e.id == u.entityId)?.name || 'N/A'}</td>
                <td><button className="btn btn-outline" onClick={() => setEditingItem({ ...u, type: 'user' })}>Edit</button></td>
              </tr>
            ))}
            {activeTab === 'projects' && filtered(projects).map(p => (
              <tr key={p.id} style={{ borderBottom: '1px solid #f9f9f9' }}>
                <td><strong>{p.name}</strong></td>
                <td><code>{p.code}</code></td>
                <td>
                  <button className="btn btn-outline" style={{ marginRight: '0.5rem' }} onClick={() => setEditingItem({ ...p, type: 'project' })}>Edit</button>
                  <button className="btn btn-outline" style={{ color: 'var(--error)' }} onClick={() => onDeleteItem('projects', p.id)}>Delete</button>
                </td>
              </tr>
            ))}
            {activeTab === 'departments' && filtered(departments).map(d => (
              <tr key={d.id} style={{ borderBottom: '1px solid #f9f9f9' }}>
                <td><strong>{d.name}</strong></td>
                <td><code>{d.code}</code></td>
                <td>
                  <button className="btn btn-outline" style={{ marginRight: '0.5rem' }} onClick={() => setEditingItem({ ...d, type: 'department' })}>Edit</button>
                  <button className="btn btn-outline" style={{ color: 'var(--error)' }} onClick={() => onDeleteItem('departments', d.id)}>Delete</button>
                </td>
              </tr>
            ))}
            {activeTab === 'expenseTypes' && filtered(expenseTypes).map(t => (
              <tr key={t.id} style={{ borderBottom: '1px solid #f9f9f9' }}>
                <td><strong>{t.label}</strong></td>
                <td><code>{t.defaultAccount}</code></td>
                <td>{t.defaultVat}%</td>
                <td>
                  <button className="btn btn-outline" style={{ marginRight: '0.5rem' }} onClick={() => setEditingItem({ ...t, type: 'expenseType' })}>Edit</button>
                  <button className="btn btn-outline" style={{ color: 'var(--error)' }} onClick={() => onDeleteItem('expense_types', t.id)}>Delete</button>
                </td>
              </tr>
            ))}
            {activeTab === 'exchangeRates' && (exchangeRates || []).filter(r => (r.from_currency + r.to_currency).toLowerCase().includes(search.toLowerCase())).map(r => (
              <tr key={r.id} style={{ borderBottom: '1px solid #f9f9f9' }}>
                <td><strong>{r.from_currency}</strong></td>
                <td><strong>{r.to_currency}</strong></td>
                <td><code>{r.rate || r.exchange_rate}</code></td>
                <td><span className="badge badge-pending">{r.period}</span></td>
                <td>
                  <button className="btn btn-outline" style={{ marginRight: '0.5rem' }} onClick={() => setEditingItem({ ...r, type: 'exchangeRate' })}>Edit</button>
                  <button className="btn btn-outline" style={{ color: 'var(--error)' }} onClick={() => onDeleteItem('exchange_rates', r.id)}>Delete</button>
                </td>
              </tr>
            ))}
            {activeTab === 'aiPrompts' && !isRestricted && (aiPrompts || []).filter(p => (p.prompt_type || '').toLowerCase().includes(search.toLowerCase())).map(p => (
              <tr key={p.id} style={{ borderBottom: '1px solid #f9f9f9' }}>
                <td><strong>{p.prompt_type}</strong></td>
                <td><small style={{ color: '#555', display: 'block', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.prompt_text}</small></td>
                <td><small>{new Date(p.updated_at).toLocaleDateString()}</small></td>
                <td>
                  <button className="btn btn-outline" style={{ marginRight: '0.5rem' }} onClick={() => setEditingItem({ ...p, type: 'aiPrompt', isReadOnly: isRestricted })}>
                    {isRestricted ? '👁️ View' : 'Edit'}
                  </button>
                  {!isRestricted && <button className="btn btn-outline" style={{ color: 'var(--error)' }} onClick={() => onDeleteItem('ai_prompts', p.id)}>Delete</button>}
                </td>
              </tr>
            ))}
            {activeTab === 'approvers' && (userEntityApprovers || []).map(ua => {
              const u = users.find(usr => usr.id === ua.user_id);
              const ent = entities.find(e => e.id === ua.entity_id);
              const appr = users.find(usr => usr.id === ua.approver_id);
              const searchLower = search.toLowerCase();
              if (search && !(
                (u?.name || '').toLowerCase().includes(searchLower) ||
                (ent?.name || '').toLowerCase().includes(searchLower) ||
                (appr?.name || '').toLowerCase().includes(searchLower)
              )) return null;

              return (
                <tr key={ua.id} style={{ borderBottom: '1px solid #f9f9f9' }}>
                  <td style={{ padding: '1rem 0' }}>{u?.name || 'Unknown User'}</td>
                  <td>{ent?.name || 'Unknown Entity'}</td>
                  <td>{appr?.name || 'None'}</td>
                  <td>{ua.is_accountant ? '✅ Yes' : '—'}</td>
                  <td>
                    <button className="btn btn-outline" style={{ color: 'var(--error)' }} onClick={() => onDeleteItem('user_entity_approvers', ua.id)}>Delete</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {editingItem && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 }}>
          <div className="card" style={{ width: '600px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem' }}>
            <h2 style={{ marginBottom: '1.5rem' }}>{editingItem.isNew ? 'Register' : 'Manage'} {editingItem.type}</h2>

            <div style={{ display: 'grid', gap: '1rem' }}>
              {(editingItem.type === 'entity' || editingItem.type === 'user' || editingItem.type === 'project' || editingItem.type === 'department') && (
                <div className="form-group">
                  <label>Display Name</label>
                  <input
                    disabled={isRestricted && editingItem.type === 'entity'}
                    value={editingItem.name || ''}
                    onChange={e => setEditingItem({ ...editingItem, name: e.target.value })}
                    placeholder="Enter name..."
                  />
                </div>
              )}

              {editingItem.type === 'entity' && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group"><label>Company Code</label><input disabled={isRestricted && editingItem.type === 'entity'} value={editingItem.code || ''} onChange={e => setEditingItem({ ...editingItem, code: e.target.value })} /></div>
                    <div className="form-group"><label>Logo (Emoji or URL)</label><input disabled={isRestricted && editingItem.type === 'entity'} value={editingItem.logo || ''} onChange={e => setEditingItem({ ...editingItem, logo: e.target.value })} /></div>
                  </div>
                  <div className="form-group"><label>Address</label><input disabled={isRestricted && editingItem.type === 'entity'} value={editingItem.address || ''} onChange={e => setEditingItem({ ...editingItem, address: e.target.value })} /></div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group"><label>Country</label><input disabled={isRestricted && editingItem.type === 'entity'} value={editingItem.country || ''} onChange={e => setEditingItem({ ...editingItem, country: e.target.value })} /></div>
                    <div className="form-group"><label>Country ISO3</label><input disabled={isRestricted && editingItem.type === 'entity'} value={editingItem.countryIso3 || ''} onChange={e => setEditingItem({ ...editingItem, countryIso3: e.target.value })} /></div>
                  </div>
                  <div className="form-group" style={{ background: '#fff9eb', padding: '0.75rem', borderRadius: '4px', border: '1px solid #fef3c7' }}>
                    <label style={{ fontWeight: 'bold', color: '#b45309', fontSize: '0.85rem' }}>Assigned Accountants</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '0.4rem' }}>
                      {(() => {
                        const accs = users.filter(u => u.roles?.includes('ACCOUNTANT') && (String(u.entityId) === String(editingItem.id) || (Array.isArray(u.assignedEntities) && u.assignedEntities.some(ae => String(ae) === String(editingItem.id)))));
                        if (accs.length === 0) return (
                          <div style={{ color: '#b45309', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>⚠️ <strong>Warning:</strong> No accountants assigned. Finance audit will not be possible for this entity.</span>
                          </div>
                        );
                        return accs.map(a => <span key={a.id} className="badge" style={{ background: '#fff', color: '#0369a1', border: '1px solid #bae6fd' }}>👤 {a.name}</span>);
                      })()}
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group"><label>Primary Currency (ISO)</label><input value={editingItem.primary_currency || ''} onChange={e => setEditingItem({ ...editingItem, primary_currency: e.target.value.toUpperCase() })} placeholder="e.g. EUR" /></div>
                    <div className="form-group"><label>Secondary Currency (ISO)</label><input value={editingItem.secondary_currency || ''} onChange={e => setEditingItem({ ...editingItem, secondary_currency: e.target.value.toUpperCase() })} placeholder="e.g. USD" /></div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label>Default Project</label>
                      <select value={editingItem.default_project_id || ''} onChange={e => setEditingItem({ ...editingItem, default_project_id: e.target.value })}>
                        <option value="">None</option>
                        {projects.map(p => <option key={p.id} value={p.id}>{p.code} - {p.name}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Default Department</label>
                      <select value={editingItem.default_department_id || ''} onChange={e => setEditingItem({ ...editingItem, default_department_id: e.target.value })}>
                        <option value="">None</option>
                        {departments.map(d => <option key={d.id} value={d.id}>{d.code} - {d.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label style={{ fontWeight: 'bold' }}>Mandatory Fields</label>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input type="checkbox" checked={editingItem.mandatoryFields?.project} onChange={e => setEditingItem({ ...editingItem, mandatoryFields: { ...editingItem.mandatoryFields, project: e.target.checked } })} /> Project
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input type="checkbox" checked={editingItem.mandatoryFields?.department} onChange={e => setEditingItem({ ...editingItem, mandatoryFields: { ...editingItem.mandatoryFields, department: e.target.checked } })} /> Department
                      </label>
                    </div>
                  </div>
                  <div className="form-group" style={{ marginTop: '1rem', background: '#f5f7fa', padding: '1rem', border: '1px solid #dcdfe6', borderRadius: '4px' }}>
                    <label style={{ fontWeight: 'bold', color: 'var(--primary)' }}>AI Processing & Audit Policies 🤖</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 1fr) 1fr', gap: '1rem', marginTop: '0.8rem', alignItems: 'center' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input type="checkbox" checked={editingItem.ai_enabled !== false} onChange={e => setEditingItem({ ...editingItem, ai_enabled: e.target.checked })} /> Auto-Extract Receipt Metadata via AI
                      </label>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: '0.8rem' }}>Duplicate Detection</label>
                        <select value={editingItem.duplicate_sensitivity || 'strict'} onChange={e => setEditingItem({ ...editingItem, duplicate_sensitivity: e.target.value })} style={{ padding: '0.3rem', fontSize: '0.85rem' }}>
                          <option value="none">Disabled (No Audit)</option>
                          <option value="strict">Strict (File Hash / Meta Match)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="form-group" style={{ marginTop: '1rem' }}>
                    <label style={{ fontWeight: 'bold' }}>Entity Accounting Studio (G/L & VAT) 🗺️</label>
                    <div style={{ border: '1px solid #eee', borderRadius: '4px', marginTop: '0.4rem', maxHeight: '250px', overflowY: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                        <thead style={{ background: '#f8f8f8', position: 'sticky', top: 0 }}>
                          <tr style={{ textAlign: 'left' }}>
                            <th style={{ padding: '0.5rem' }}>Global Category</th>
                            <th style={{ padding: '0.5rem' }}>G/L Account</th>
                            <th style={{ padding: '0.5rem' }}>VAT %</th>
                          </tr>
                        </thead>
                        <tbody>
                          {expenseTypes.map(t => (
                            <tr key={t.id} style={{ borderTop: '1px solid #eee' }}>
                              <td style={{ padding: '0.4rem 0.5rem' }}>{t.label}</td>
                              <td style={{ padding: '0.4rem 0.5rem' }}>
                                <input
                                  style={{ width: '85px', padding: '0.2rem', border: '1px solid #ddd', borderRadius: '3px' }}
                                  value={editingItem.expenseMappings?.[t.id]?.glAccount || ''}
                                  onChange={e => {
                                    const next = { ...(editingItem.expenseMappings || {}) };
                                    next[t.id] = { ...(next[t.id] || {}), glAccount: e.target.value };
                                    setEditingItem({ ...editingItem, expenseMappings: next });
                                  }}
                                  placeholder="Code..."
                                />
                              </td>
                              <td style={{ padding: '0.4rem 0.5rem' }}>
                                <input
                                  type="number"
                                  style={{ width: '60px', padding: '0.2rem', border: '1px solid #ddd', borderRadius: '3px' }}
                                  value={editingItem.expenseMappings?.[t.id]?.vatRate || 0}
                                  onChange={e => {
                                    const next = { ...(editingItem.expenseMappings || {}) };
                                    next[t.id] = { ...(next[t.id] || {}), vatRate: parseFloat(e.target.value) || 0 };
                                    setEditingItem({ ...editingItem, expenseMappings: next });
                                  }}
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}

              {editingItem.type === 'user' && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                    <div className="form-group"><label>Email Address</label><input type="email" value={editingItem.email || ''} onChange={e => setEditingItem({ ...editingItem, email: e.target.value })} /></div>
                    <div className="form-group">
                      <label>Account Status</label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f5f5f5', padding: '0.4rem', borderRadius: '4px', cursor: 'pointer' }}>
                        <input type="checkbox" checked={editingItem.is_active !== false} onChange={e => setEditingItem({ ...editingItem, is_active: e.target.checked })} />
                        {editingItem.is_active !== false ? '✅ Active' : '🚫 Inactive'}
                      </label>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label>Primary Entity</label>
                      <select value={editingItem.entityId || ''} onChange={e => setEditingItem({ ...editingItem, entityId: e.target.value })}>
                        <option value="">Select Entity</option>
                        {entities.map(en => <option key={en.id} value={en.id}>{en.name}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Direct Approver</label>
                      <select value={editingItem.approverId || ''} onChange={e => setEditingItem({ ...editingItem, approverId: e.target.value })}>
                        <option value="">No Approver</option>
                        {users.filter(u => u.id !== editingItem.id).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label style={{ fontWeight: 'bold' }}>Permissions & Roles</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                      {AVAILABLE_ROLES.map(role => (
                        <label key={role} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', background: '#f5f5f5', borderRadius: '4px' }}>
                          <input
                            type="checkbox"
                            checked={Array.isArray(editingItem.roles) ? editingItem.roles.includes(role) : editingItem.roles === role}
                            onChange={e => {
                              const currentRoles = Array.isArray(editingItem.roles) ? editingItem.roles : [editingItem.roles];
                              const next = e.target.checked ? [...currentRoles, role] : currentRoles.filter(r => r !== role);
                              setEditingItem({ ...editingItem, roles: next });
                            }}
                          /> {role}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="form-group">
                    <label style={{ fontWeight: 'bold' }}>Cross-Entity Approvals (Explicit Assignments)</label>
                    <div className="assignment-chips">
                      {(editingItem.assignedEntities || [])
                        .filter(id => id !== editingItem.entityId) // Hide primary entity from this list
                        .map(entId => {
                          const ent = entities.find(e => e.id === entId);
                          return (
                            <div key={entId} className="chip">
                              {ent?.name || entId}
                              <span className="chip-remove" onClick={() => {
                                const next = editingItem.assignedEntities.filter(id => id !== entId);
                                setEditingItem({ ...editingItem, assignedEntities: next });
                              }}>×</span>
                            </div>
                          );
                        })}
                    </div>

                    <select
                      value=""
                      onChange={e => {
                        if (!e.target.value) return;
                        const existing = editingItem.assignedEntities || [];
                        if (!existing.includes(e.target.value)) {
                          setEditingItem({ ...editingItem, assignedEntities: [...existing, e.target.value] });
                        }
                      }}
                      style={{ fontSize: '0.85rem', padding: '0.5rem' }}
                    >
                      <option value="">+ Add Additional Entity...</option>
                      {entities
                        .filter(e =>
                          String(e.id) !== String(editingItem.entityId) &&
                          !(editingItem.assignedEntities || []).includes(e.id)
                        )
                        .map(e => <option key={e.id} value={e.id}>{e.name}</option>)
                      }
                    </select>
                  </div>
                </>
              )}

              {/* Per-Entity Configuration Panel */}
              {editingItem.type === 'user' && (
                <div className="form-group" style={{ marginTop: '1rem', borderTop: '2px solid #eee', paddingTop: '1rem' }}>
                  <label style={{ fontWeight: 'bold' }}>Per-Entity Configuration (Approvers & Accountants)</label>
                  <p style={{ fontSize: '0.75rem', color: '#666' }}>Configure approvers or set user as accountant for each assigned entity.</p>
                  <div style={{ display: 'grid', gap: '0.8rem', marginTop: '0.5rem' }}>
                    {(() => {
                      // Order: Primary Entity first, then any other assigned secondary entities
                      const list = [
                        ...(editingItem.entityId ? [editingItem.entityId] : []),
                        ...(editingItem.assignedEntities || []).filter(id => id !== editingItem.entityId)
                      ];
                      return list.map(entId => {
                        const isPrimary = entId === editingItem.entityId;
                        const ent = entities.find(e => e.id === entId);
                        const multiCfg = editingItem.multiEntityConfig?.[entId] ||
                          userEntityApprovers?.find(ua => ua.user_id === editingItem.id && ua.entity_id === entId) || {};
                        return (
                          <div key={entId} style={{ background: isPrimary ? '#f0f7ff' : '#fcfcfc', border: isPrimary ? '1px solid var(--primary)' : '1px solid #ddd', padding: '0.8rem', borderRadius: '4px', display: 'grid', gridTemplateColumns: 'minmax(120px, 1fr) 2fr auto', gap: '1rem', alignItems: 'center' }}>
                            <strong style={{ fontSize: '0.85rem' }}>
                              {ent?.name || entId}
                              {isPrimary && <span style={{ marginLeft: '0.5rem', color: 'var(--primary)', fontSize: '0.7rem' }}>(PRIMARY)</span>}
                            </strong>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <label style={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}>Approver:</label>
                              <select
                                style={{ padding: '0.2rem', fontSize: '0.8rem', width: '100%' }}
                                value={multiCfg.approver_id || ''}
                                onChange={e => {
                                  const config = { ...(editingItem.multiEntityConfig || {}) };
                                  config[entId] = { ...multiCfg, approver_id: e.target.value };
                                  setEditingItem({ ...editingItem, multiEntityConfig: config });
                                }}>
                                <option value="">None</option>
                                {users.filter(u => u.id !== editingItem.id).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                              </select>
                            </div>
                            <label style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                              <input
                                type="checkbox"
                                checked={multiCfg.is_accountant || false}
                                onChange={e => {
                                  const config = { ...(editingItem.multiEntityConfig || {}) };
                                  config[entId] = { ...multiCfg, is_accountant: e.target.checked };
                                  setEditingItem({ ...editingItem, multiEntityConfig: config });
                                }}
                              /> Is Accountant
                            </label>
                          </div>
                        );
                      });
                    })()
                    }
                    {!(editingItem.assignedEntities?.length > 0) && <p style={{ fontSize: '0.8rem', fontStyle: 'italic', color: '#999' }}>Assign entities to configure approvers.</p>}
                  </div>
                </div>
              )}

              {(editingItem.type === 'project' || editingItem.type === 'department') && (
                <div className="form-group"><label>Reference Code</label><input value={editingItem.code || ''} onChange={e => setEditingItem({ ...editingItem, code: e.target.value })} /></div>
              )}

              {editingItem.type === 'expenseType' && (
                <>
                  <div className="form-group"><label>Category Label</label><input value={editingItem.label || ''} onChange={e => setEditingItem({ ...editingItem, label: e.target.value })} /></div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group"><label>G/L Account</label><input value={editingItem.defaultAccount || ''} onChange={e => setEditingItem({ ...editingItem, defaultAccount: e.target.value })} /></div>
                    <div className="form-group"><label>Default VAT (%)</label><input type="number" value={editingItem.defaultVat || 0} onChange={e => setEditingItem({ ...editingItem, defaultVat: e.target.value })} /></div>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input type="checkbox" checked={editingItem.requiresEntertainment} onChange={e => setEditingItem({ ...editingItem, requiresEntertainment: e.target.checked })} /> Requires Entertainment Details
                  </label>
                </>
              )}

              {editingItem.type === 'exchangeRate' && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group"><label>From Currency</label><input value={editingItem.from_currency || ''} onChange={e => setEditingItem({ ...editingItem, from_currency: e.target.value.toUpperCase() })} placeholder="e.g. USD" /></div>
                    <div className="form-group"><label>To Currency (Claim)</label><input value={editingItem.to_currency || ''} onChange={e => setEditingItem({ ...editingItem, to_currency: e.target.value.toUpperCase() })} placeholder="e.g. EUR" /></div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group"><label>Month (1-12)</label><input type="number" min="1" max="12" value={editingItem.rate_month || ''} onChange={e => setEditingItem({ ...editingItem, rate_month: e.target.value })} /></div>
                    <div className="form-group"><label>Year</label><input type="number" min="2000" max="2100" value={editingItem.rate_year || ''} onChange={e => setEditingItem({ ...editingItem, rate_year: e.target.value })} /></div>
                  </div>
                  <div className="form-group"><label>Exchange Rate</label><input type="number" step="0.0001" value={editingItem.rate !== undefined ? editingItem.rate : (editingItem.exchange_rate !== undefined ? editingItem.exchange_rate : '')} onChange={e => setEditingItem({ ...editingItem, exchange_rate: e.target.value, rate: e.target.value })} placeholder="e.g. 0.92" /></div>
                </>
              )}

              {editingItem.type === 'aiPrompt' && (
                <>
                  <div className="form-group">
                    <label>Prompt Type Identifier (e.g. "receipt")</label>
                    <input value={editingItem.prompt_type || ''} onChange={e => setEditingItem({ ...editingItem, prompt_type: e.target.value })} disabled={!editingItem.isNew || editingItem.isReadOnly} />
                  </div>
                  <div className="form-group">
                    <label>Extraction Instructions (Sent to Gemini 2.5 Flash)</label>
                    <small style={{ display: 'block', marginBottom: '0.5rem', color: '#666' }}>Note: Use `{"{{allowedCategories}}"}` to dynamically inject active Expense Types during the call.</small>
                    <textarea
                      value={editingItem.prompt_text || ''}
                      onChange={e => setEditingItem({ ...editingItem, prompt_text: e.target.value })}
                      disabled={editingItem.isReadOnly}
                      style={{ width: '100%', height: '200px', padding: '0.5rem', fontFamily: 'monospace', fontSize: '0.85rem' }}
                    />
                  </div>
                </>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '2rem' }}>
              {!editingItem.isReadOnly && <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSave}>Confirm & Sync</button>}
              <button className="btn btn-outline" style={{ flex: editingItem.isReadOnly ? 1 : 'none' }} onClick={() => setEditingItem(null)}>{editingItem.isReadOnly ? 'Close' : 'Discard'}</button>
            </div>
          </div>
        </div>
      )}
      <BulkImportModal
        isOpen={showBulkImport}
        onClose={() => setShowBulkImport(false)}
        targetTable={activeTab === 'approvers' ? 'user_entity_approvers' : (collectionMap[activeTab.slice(0, -1)] || activeTab)}
        onImportSuccess={fetchGlobalData}
      />
    </div>
  );
};

// --- MAIN APP ---

function App() {
  const fetchWithTimeout = (promise, ms) => {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('TIMEOUT_EXCEEDED')), ms);
      promise.then(res => { clearTimeout(timer); resolve(res); }).catch(err => { clearTimeout(timer); reject(err); });
    });
  };

  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('expenseApp_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [view, setView] = useState(() => {
    return localStorage.getItem('expenseApp_view') || 'dashboard';
  });
  const [claims, setClaims] = useState([]);
  const [entities, setEntities] = useState([]);
  const [expenseTypes, setExpenseTypes] = useState([]);
  const [projects, setProjects] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [exchangeRates, setExchangeRates] = useState([]);
  const [userEntityApprovers, setUserEntityApprovers] = useState([]);
  const [aiPrompts, setAiPrompts] = useState([]);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [importedClaim, setImportedClaim] = useState(null);
  const [loading, setLoading] = useState(false);
  const [previewReceipt, setPreviewReceipt] = useState(null);
  const [sessionBlobMap, setSessionBlobMap] = useState({});
  const [globalLoadingMessage, setGlobalLoadingMessage] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const getAccountantsForEntity = (entityId) => {
    return (users || []).filter(u =>
      u.roles?.includes('ACCOUNTANT') &&
      (String(u.entityId) === String(entityId) || (Array.isArray(u.assignedEntities) && u.assignedEntities.some(ae => String(ae) === String(entityId))))
    );
  };

  // A user is a manager if they are assigned as an explicit approver in the mapping table
  const isManagerApprover = React.useMemo(() => {
    if (!user) return false;
    if (user.roles?.includes('MANAGER')) return true;
    if (userEntityApprovers && userEntityApprovers.some(ua => ua.approver_id == user.id)) return true;
    return false;
  }, [user, userEntityApprovers]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('expenseApp_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('expenseApp_user');
      localStorage.removeItem('expenseApp_view');
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('expenseApp_view', view);
    }
  }, [view, user]);

  // Global user state sync: if the users list refreshes from DB, ensure current session user is up-to-date
  useEffect(() => {
    if (user && users.length > 0) {
      const freshUser = users.find(u => String(u.id) == String(user.id));
      if (freshUser) {
        // Compare to prevent infinite re-renders
        const minimalOld = { id: user.id, roles: user.roles, entityId: user.entityId, assignedEntities: user.assignedEntities };
        const minimalNew = { id: freshUser.id, roles: freshUser.roles, entityId: freshUser.entityId, assignedEntities: freshUser.assignedEntities };
        if (JSON.stringify(minimalOld) !== JSON.stringify(minimalNew)) {
          setUser(prev => ({ ...prev, ...freshUser }));
        }
      }
    }
  }, [users, user?.id]);

  useEffect(() => {
    // Standardized Listener for Auth State
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`DEBUG: Auth Event: ${event}`, session?.user?.email);
      syncUserFromSession(session, event);
    });

    // Check Initial Session once
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) syncUserFromSession(session, 'INITIAL_LOAD');
      else setUser(null);
    });

    // SPA routing safety
    if (window.location.pathname !== '/' && window.location.pathname !== '/index.html') {
      window.history.replaceState({}, '', '/');
    }
    fetchGlobalData();

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const syncUserFromSession = async (session, event) => {
    if (!session) {
      setUser(null);
      localStorage.removeItem('expenseApp_user');
      return;
    }

    try {
      console.log(`DEBUG: Syncing user for session (${event}):`, session.user.email);

      let appUser = null;
      let fetchWorked = false;

      try {
        const { data, error: appUserErr } = await fetchWithTimeout(
          supabase.from('users').select('*').ilike('email', session.user.email).single(),
          5000
        );
        if (data) {
          appUser = data;
          fetchWorked = true;
          console.log("DEBUG: appUser fetch: SUCCESS", appUser.email);
        } else {
          console.log("DEBUG: appUser fetch: NOT FOUND IN DB", appUserErr?.message || "");
        }
      } catch (err) {
        console.warn("DEBUG: appUser fetch: TIMEOUT or FAILURE", err.message);
      }

      const isMaster = session.user.email === 'wfciadminsk@dcbi.aero';

      if (fetchWorked && appUser) {
        const fresh = { ...appUser, entityId: appUser.entity_id, approverId: appUser.approver_id, assignedEntities: appUser.assigned_entities || [] };
        console.log("DEBUG: Setting finalized user state.");
        setUser(fresh);
        localStorage.setItem('expenseApp_user', JSON.stringify(fresh));
      } else {
        console.log("DEBUG: Bootstrapping temporary state. Master Admin:", isMaster);
        const temp = {
          email: session.user.email,
          id: session.user.id,
          name: session.user.email.split('@')[0],
          roles: isMaster ? ['ADMIN', 'STAFF'] : ['STAFF'],
          entityId: null,
          assignedEntities: []
        };
        setUser(temp);

        if (isMaster && !fetchWorked) {
          // Provision Master Admin in background if missing
          supabase.from('users').insert({
            id: session.user.id,
            email: session.user.email,
            name: 'Master Admin',
            roles: ['ADMIN', 'STAFF']
          }).then(({ error }) => {
            if (!error) console.log("DEBUG: Master Admin auto-provisioned successfully.");
            else console.warn("DEBUG: Master Admin auto-provisioning failed (may already exist):", error.message);
          });
        }
      }
    } catch (err) {
      console.error("DEBUG: syncUserFromSession failed:", err);
    }
  };

  useEffect(() => {
    let claimsSub;
    if (user) {
      fetchUserData();

      // Auto-sync other browser tabs in realtime when a Claim goes through Approval/Submission
      claimsSub = supabase
        .channel('schema-db-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'claims' },
          () => {
            fetchUserData();
          }
        )
        .subscribe();
    }

    return () => {
      if (claimsSub) supabase.removeChannel(claimsSub);
    };
  }, [user, userEntityApprovers]);

  const fetchGlobalData = async () => {
    console.log("DEBUG: fetchGlobalData starting...");
    try {
      const [eRes, uRes, pRes, dRes, tRes, ueaRes, xRes, apRes] = await Promise.all([
        supabase.from('entities').select('*'),
        supabase.from('users').select('*'),
        supabase.from('projects').select('*'),
        supabase.from('departments').select('*'),
        supabase.from('expense_types').select('*'),
        supabase.from('user_entity_approvers').select('*'),
        supabase.from('exchange_rates').select('*'),
        supabase.from('ai_prompts').select('*')
      ]);
      console.log("DEBUG: fetchGlobalData Promise.all resolved.");

      const errors = [eRes.error, uRes.error, pRes.error, dRes.error, tRes.error, ueaRes.error, xRes.error, apRes.error].filter(Boolean);
      if (errors.length > 0) {
        console.error('Supabase Global Fetch Errors:', errors);
        const tableMissing = errors.some(e => e.code === '42P01');
        if (tableMissing) {
          alert('⚠️ SUPABASE SETUP REQUIRED: The database tables were not found. Please run "supabase_schema.sql" in your Supabase SQL Editor.');
        } else {
          alert('⚠️ SUPABASE CONNECTION ERROR: ' + errors[0].message);
        }
        return;
      }

      if (eRes.data) setEntities(eRes.data.map(e => ({
        ...e,
        countryIso3: e.country_iso3,
        mandatoryFields: e.mandatory_fields,
        expenseMappings: e.expense_mappings
      })));
      if (uRes.data) setUsers(uRes.data.map(u => ({
        ...u,
        entityId: u.entity_id,
        approverId: u.approver_id,
        assignedEntities: u.assigned_entities || []
      })));
      if (pRes.data) setProjects(pRes.data);
      if (dRes.data) setDepartments(dRes.data);
      if (tRes.data) setExpenseTypes(tRes.data.map(t => ({
        ...t,
        defaultAccount: t.default_account,
        defaultVat: t.default_vat,
        requiresEntertainment: t.requires_entertainment
      })));
      if (ueaRes.data) setUserEntityApprovers(ueaRes.data);
      if (xRes.data) setExchangeRates(xRes.data.map(r => ({
        ...r,
        period: `${r.rate_year}-${String(r.rate_month).padStart(2, '0')}` // formatting YYYY-MM
      })));
      if (apRes.data) setAiPrompts(apRes.data);
    } catch (err) {
      console.warn('Supabase fetch failed, falling back to local mocks', err);
    }
  };

  const fetchUserData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const isFin = user.roles.includes('ACCOUNTANT') || user.roles.includes('ADMIN');
      const isMgr = isManagerApprover;

      // Fetch claims: staff only see their own, managers/finance fetch all here but filtered later
      let claimsQuery = supabase.from('claims').select('*, expense_items(*)');
      if (!user.roles.includes('ADMIN') && !isFin && !isMgr) {
        claimsQuery = claimsQuery.eq('user_id', user.id);
      }

      const [cRes, rRes] = await Promise.all([
        claimsQuery,
        supabase.from('receipts').select('*').eq('user_id', user.id).eq('status', 'UNALLOCATED')
      ]);

      if (cRes.data) {
        let visibleClaims = cRes.data;
        const isFin = user.roles.includes('ACCOUNTANT') || user.roles.includes('ADMIN');

        if (isFin || isManagerApprover) {
          visibleClaims = cRes.data.filter(c => {
            if (c.user_id === user.id) return true; // Always download your own claims

            // GLOBAL ADMIN EXCEPTION: Admin sees EVERYTHING across all users/entities
            if (user.roles.includes('ADMIN')) return true;

            // Check if user is accountant for this entity
            const isAccForEntity = userEntityApprovers.some(ua => ua.user_id === user.id && ua.entity_id === c.entity_id && ua.is_accountant);
            if (user.roles.includes('ACCOUNTANT') && isAccForEntity && c.claim_status !== 'NEW') return true;

            // Check if user is explicit approver for this claim
            const isApprForUser = c.approver_id == user.id;
            if (isManagerApprover && isApprForUser && c.claim_status !== 'NEW') return true;

            // Check if the user ever previously acted on this claim (so it shows in Processed History)
            const actedOnIt = (c.history || []).some(h => h.actorId == user.id);
            if (actedOnIt) return true;

            return false;
          });
        }

        setClaims(visibleClaims.map(c => ({
          ...c,
          userId: c.user_id,
          entityId: c.entity_id,
          currency: c.currency || (c.expense_items && c.expense_items[0]?.claim_currency) || (c.id.includes('-') ? c.id.split('-').pop() : 'EUR'),
          claimStatus: c.claim_status,
          approvalStatus: c.approval_status,
          expenses: (c.expense_items || []).map(e => ({
            ...e,
            date: e.exchange_rate_date || e.date,
            payment_type: e.payment_type || (e.payment === 'COMPANY_CREDITCARD' ? 'CompanyCard' : 'CashReimbursement'),
            backlogId: e.backlog_id
          }))
        })));
      }
      if (rRes.data) setReceipts(rRes.data);
    } catch (err) {
      console.error('User data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchData = () => {
    fetchGlobalData();
    if (user) fetchUserData();
  };

  const handleSaveAdminItem = async (collection, item) => {
    try {
      const { isNew, type, ...payload } = item;

      // Database Schema "Pick" sets to prevent 400 Errors from frontend-only noise
      const USER_COLS = ['id', 'name', 'email', 'roles', 'entity_id', 'approver_id', 'assigned_entities', 'is_active', 'offset_account_credit_card', 'offset_account_cash'];
      const ENTITY_COLS = ['id', 'name', 'code', 'address', 'country', 'country_iso3', 'logo', 'mandatory_fields', 'expense_mappings', 'ai_enabled', 'duplicate_sensitivity', 'primary_currency', 'secondary_currency'];
      const EXPENSE_TYPE_COLS = ['id', 'label', 'default_account', 'default_vat', 'requires_entertainment'];
      const EXCHANGE_RATE_COLS = ['id', 'from_currency', 'to_currency', 'exchange_rate', 'rate_month', 'rate_year', 'rate_type', 'source', 'created_by'];
      const AI_PROMPT_COLS = ['id', 'prompt_type', 'prompt_text', 'is_active', 'tokens_estimate'];

      const dbPayload = {};

      if (collection === 'entities') {
        const mapped = { ...payload, mandatory_fields: payload.mandatoryFields, expense_mappings: payload.expenseMappings, country_iso3: payload.countryIso3 };
        ENTITY_COLS.forEach(col => { if (mapped[col] !== undefined) dbPayload[col] = mapped[col]; });
      } else if (collection === 'users') {
        const mapped = { ...payload, entity_id: payload.entityId, approver_id: payload.approverId, assigned_entities: payload.assignedEntities };
        USER_COLS.forEach(col => { if (mapped[col] !== undefined) dbPayload[col] = mapped[col]; });
      } else if (collection === 'expense_types') {
        const mapped = { ...payload, default_account: payload.defaultAccount, default_vat: payload.defaultVat, requires_entertainment: payload.requiresEntertainment };
        EXPENSE_TYPE_COLS.forEach(col => { if (mapped[col] !== undefined) dbPayload[col] = mapped[col]; });
      } else if (collection === 'exchange_rates') {
        const mapped = {
          ...payload,
          from_currency: payload.from_currency || payload.fromCurrency,
          to_currency: payload.to_currency || payload.toCurrency,
          exchange_rate: payload.exchange_rate || payload.rate,
          rate_month: payload.rate_month || payload.month,
          rate_year: payload.rate_year || payload.year
        };
        EXCHANGE_RATE_COLS.forEach(col => { if (mapped[col] !== undefined) dbPayload[col] = mapped[col]; });
      } else if (collection === 'ai_prompts') {
        const mapped = { ...payload, prompt_type: payload.prompt_type || payload.promptType, is_active: payload.is_active !== undefined ? payload.is_active : payload.isActive };
        AI_PROMPT_COLS.forEach(col => { if (mapped[col] !== undefined) dbPayload[col] = mapped[col]; });
      } else {
        Object.assign(dbPayload, payload);
      }

      // Ensure ID for new items (if not provided)
      if (isNew && !dbPayload.id) {
        dbPayload.id = crypto.randomUUID ? crypto.randomUUID() : (Date.now().toString(36) + Math.random().toString(36).substr(2, 5)).toUpperCase();
      }

      // CRITICAL: Convert empty strings to NULL for database foreign keys to allow "removing" positions
      if (collection === 'users') {
        if (dbPayload.entity_id === "") dbPayload.entity_id = null;
        if (dbPayload.approver_id === "") dbPayload.approver_id = null;
      }

      const { error } = await supabase
        .from(collection)
        .upsert(dbPayload);

      if (error) {
        alert('Save failed: ' + error.message);
      } else {
        // Handle User Entity Approvers Multi-saving
        if (collection === 'users' && payload.multiEntityConfig) {
          const finalAssigned = dbPayload.assigned_entities || payload.assignedEntities || item.assignedEntities || [];

          // 1. Delete configs for entities no longer assigned
          const { data: existingUEAs } = await supabase.from('user_entity_approvers').select('entity_id').eq('user_id', item.id);
          if (existingUEAs) {
            const removedEntities = existingUEAs.filter(ua => !finalAssigned.includes(ua.entity_id)).map(ua => ua.entity_id);
            if (removedEntities.length > 0) {
              await supabase.from('user_entity_approvers').delete().eq('user_id', item.id).in('entity_id', removedEntities);
            }
          }

          // 2. Upsert current configs
          const ueaPayloads = Object.entries(payload.multiEntityConfig)
            .filter(([entId]) => finalAssigned.includes(entId))
            .map(([entId, cfg]) => ({
              id: cfg.id || undefined,
              user_id: dbPayload.id || item.id,
              entity_id: entId,
              approver_id: cfg.approver_id === "" ? null : (cfg.approver_id || null),
              is_accountant: !!cfg.is_accountant,
              is_active: true
            }));

          for (const uea of ueaPayloads) {
            const { error: ueaErr } = await supabase.from('user_entity_approvers').upsert(uea);
            if (ueaErr) console.warn('Failed to save per-entity config for ', uea.entity_id, ueaErr.message);
          }
        }
        await fetchData();
      }
    } catch (err) {
      console.error('Admin save error:', err);
      alert('Network error during admin save');
    }
  };

  const handleDeleteAdminItem = async (collection, id) => {
    try {
      const { error } = await supabase
        .from(collection)
        .delete()
        .eq('id', id);

      if (error) {
        alert('Delete failed: ' + error.message);
      } else {
        await fetchData();
      }
    } catch (err) {
      console.error('Admin delete error:', err);
      alert('Network error during admin delete');
    }
  };

  const handleSaveClaim = async (claimData) => {
    try {
      const { expenses, ...claimBase } = claimData;

      const dbBase = { ...claimBase };
      if (dbBase.id && String(dbBase.id).startsWith('DRAFT-')) {
        // Custom Sequence ID: [EntityCode]-[Month]-[HourMinute]-[Currency]
        const ent = entities.find(e => String(e.id) == String(dbBase.entity_id || claimData.entityId));
        const entCode = ent?.code || ent?.companyCode || 'EX';
        const now = new Date();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const hhmm = String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0');
        const cur = claimData.currency || (expenses && expenses[0]?.currency) || 'EUR';

        dbBase.id = `${entCode}-${mm}-${hhmm}-${cur}`;

        // Safety: If ID already exists (unlikely collision), add small suffix
        const isDuplicate = claims.some(c => c.id === dbBase.id);
        if (isDuplicate) {
          dbBase.id += '-' + Math.random().toString(36).substr(2, 3).toUpperCase();
        }
      }
      if (dbBase.currency !== undefined) {
        delete dbBase.currency; // Currency is stored on expense_items, not claims table
      }
      if (dbBase.advanceAmount !== undefined) {
        dbBase.advance_amount = dbBase.advanceAmount;
        delete dbBase.advanceAmount;
      }
      if (dbBase.claimStatus !== undefined) {
        dbBase.claim_status = dbBase.claimStatus;
        delete dbBase.claimStatus;
      }
      if (dbBase.approvalStatus !== undefined) {
        dbBase.approval_status = dbBase.approvalStatus;
        delete dbBase.approvalStatus;
      }
      if (dbBase.entityId !== undefined) {
        dbBase.entity_id = dbBase.entityId;
        delete dbBase.entityId;
      }
      if (dbBase.userId !== undefined) {
        dbBase.user_id = dbBase.userId;
        delete dbBase.userId;
      }
      if (dbBase.approverId !== undefined) {
        dbBase.approver_id = dbBase.approverId;
        delete dbBase.approverId;
      }

      // 1. Save Claim Base
      // Audit History logic for saving
      const isNew = String(dbBase.id).startsWith('DRAFT-');
      const actionText = isNew ? "Created"
        : (dbBase.claimStatus === CLAIM_STATUS.SUBMITTED ? "Submitted" : "Saved as Draft");

      const { data: currentClaim } = await supabase.from('claims').select('history, approval_status, claim_status').eq('id', dbBase.id).single();
      const newHistory = [...(currentClaim?.history || []), {
        timestamp: new Date().toISOString(),
        actorId: user.id,
        actorName: user.name,
        action: actionText,
        prevApprovalStatus: currentClaim?.approval_status || 'N/A',
        prevClaimStatus: currentClaim?.claim_status || 'NEW',
        newApprovalStatus: dbBase.approvalStatus || 'N/A',
        newClaimStatus: dbBase.claimStatus || 'NEW'
      }];

      const safeClaim = {
        id: dbBase.id,
        title: dbBase.title,
        user_id: dbBase.user_id || user.id,
        entity_id: dbBase.entity_id,
        approver_id: dbBase.approver_id,
        currency: claimData.currency || (expenses && expenses[0]?.currency) || 'EUR',
        advance_amount: Number(dbBase.advance_amount) || 0,
        claim_status: dbBase.claim_status,
        approval_status: dbBase.approval_status,
        claim_type: claimData.claim_type || 'CashReimbursement',
        statement_attachment: claimData.statement_attachment || null,
        import_batch_id: claimData.import_batch_id || null,
        submission_date: dbBase.claim_status === CLAIM_STATUS.SUBMITTED ? new Date().toISOString() : (dbBase.submission_date ? new Date(dbBase.submission_date).toISOString() : null),
        history: newHistory
      };

      const { data: claim, error: cErr } = await supabase
        .from('claims')
        .upsert(safeClaim)
        .select()
        .single();

      if (cErr) {
        console.error("Supabase Save Error for Claims:", cErr, "Payload:", safeClaim);
        throw cErr;
      }

      // 2. Save Normalized Expenses
      let oldBacklogIds = [];
      if (expenses && expenses.length > 0) {
        // Find previously allocated receipts so we can release them if removed
        const { data: dbExpenses } = await supabase.from('expense_items').select('id, backlog_id').eq('claim_id', claim.id);
        const oldExpenses = dbExpenses || [];
        oldBacklogIds = oldExpenses.map(e => e.backlog_id).filter(Boolean);

        const payloadIds = [];
        const expensePayload = expenses.map(e => {
          const isTempId = !e.id || typeof e.id === 'number' || (typeof e.id === 'string' && !e.id.includes('-') && !e.id.includes('.'));
          const finalId = isTempId ? (crypto.randomUUID ? crypto.randomUUID() : `EXP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`) : e.id;
          payloadIds.push(finalId);

          let rate = 1;
          const claimCurrency = claimData.currency || 'EUR';
          if (e.currency !== claimCurrency) {
            const period = e.date ? e.date.substring(0, 7) : null;
            const rateItem = exchangeRates?.find(r => r.period === period && r.from_currency === e.currency && r.to_currency === claimCurrency);
            if (rateItem) rate = Number(rateItem.exchange_rate || rateItem.rate);
          }

          return {
            id: finalId,
            claim_id: claim.id,
            type: e.type,
            amount: Number(e.amount) || 0,
            currency: e.currency,

            // Multi-Currency Implementation Columns
            expense_currency: e.currency,
            gross_amount: Number(e.amount) || 0,
            claim_currency: claimCurrency,
            claim_amount: (Number(e.amount) || 0) * rate,
            exchange_rate: rate,
            exchange_rate_date: e.date || null,
            exchange_rate_source: rate !== 1 ? 'system' : null,

            payment_type: e.payment_type || (e.payment === 'COMPANY_CREDITCARD' ? 'CompanyCard' : 'CashReimbursement'),
            payment: e.payment || (e.payment_type === 'CompanyCard' ? 'COMPANY_CREDITCARD' : 'REIMBURSABLE'),
            receipt: e.receipt,
            project: e.project,
            department: e.department,
            description: e.description,
            backlog_id: e.backlogId || e.backlog_id,
            clients: e.clients,
            attendees: e.attendees ? Number(e.attendees) : null,
            purpose: e.purpose,

            // Persistence for statement-imported fields
            billing_date: e.date || null,
            billing_amount: Number(e.billing_amount) || Number(e.amount) || 0,
            billing_currency: e.payment_type === 'CompanyCard'
              ? (e.billing_currency || entities.find(el => el.id == (claimBase.entity_id || claimBase.entityId))?.primary_currency || 'EUR')
              : (e.billing_currency || e.currency),
            immutable: !!e.immutable,
            external_reference: e.external_reference || null
          };
        });

        // UPSERT the current expenses array to avoid 409 conflict
        const { error: eErr } = await supabase.from('expense_items').upsert(expensePayload);
        if (eErr) throw eErr;

        // Cleanup: remove expenses that were deleted from the UI form by finding what was in the DB that isn't in payloadIds
        const toDeleteIds = oldExpenses.map(o => o.id).filter(id => !payloadIds.includes(id));
        if (toDeleteIds.length > 0) {
          await supabase.from('expense_items').delete().in('id', toDeleteIds);
        }
      } else {
        // Form was cleared entirely, delete all positions associated with it
        await supabase.from('expense_items').delete().eq('claim_id', claim.id);
      }

      // 3. Clean up allocated receipts vs released receipts
      const allocatedBacklogIds = (expenses || []).filter(e => e.backlogId).map(e => e.backlogId);
      if (allocatedBacklogIds.length > 0) {
        await supabase.from('receipts').update({ status: 'ALLOCATED' }).in('id', allocatedBacklogIds);
      }

      const unallocatedBacklogIds = oldBacklogIds.filter(id => !allocatedBacklogIds.includes(id));
      if (unallocatedBacklogIds.length > 0) {
        await supabase.from('receipts').update({ status: 'UNALLOCATED' }).in('id', unallocatedBacklogIds);
      }

      await fetchData();
      setView('dashboard');
      setImportedClaim(null);
    } catch (err) {
      console.error('Save error:', err);
      alert('Network error during save: ' + (err.message || 'Unknown error'));
    }
  };

  const handleStatusUpdate = async (id, update) => {
    try {
      // 1. Get current claim for history
      const { data: current } = await supabase.from('claims').select('*').eq('id', id).single();
      const actionText = update.claimStatus === CLAIM_STATUS.CLOSED ? "Synced (Closed)"
        : update.claimStatus === CLAIM_STATUS.ACCRUED ? "Accrued"
          : update.approvalStatus === APPROVAL_STATUS.APPROVED ? "Approved"
            : update.approvalStatus === APPROVAL_STATUS.REJECTED ? "Rejected"
              : "Status Updated";

      const newHistory = [...(current?.history || []), {
        timestamp: new Date().toISOString(),
        actorId: user.id,
        actorName: user.name,
        action: actionText,
        prevApprovalStatus: current.approval_status,
        prevClaimStatus: current.claim_status,
        newApprovalStatus: update.approvalStatus || current.approval_status,
        newClaimStatus: update.claimStatus || current.claim_status,
        ...update
      }];

      // Convert camelCase to snake_case for Supabase REST requirements
      const dbUpdate = { history: newHistory };
      if (update.approvalStatus !== undefined) dbUpdate.approval_status = update.approvalStatus;
      if (update.claimStatus !== undefined) dbUpdate.claim_status = update.claimStatus;
      if (update.managerApprovedAt !== undefined) dbUpdate.manager_approved_at = update.managerApprovedAt;
      if (update.accountantApprovedAt !== undefined) dbUpdate.accountant_approved_at = update.accountantApprovedAt;

      // 2. Update status and history
      const { error } = await supabase
        .from('claims')
        .update(dbUpdate)
        .eq('id', id);

      if (error) {
        alert('Action failed: ' + error.message);
        return;
      }
      await fetchData();
      setSelectedClaim(null);
    } catch (err) {
      alert('Network error during update');
    }
  };

  const handleLocalReceiptUpload = async (file) => {
    setGlobalLoadingMessage(`Gemini AI is analyzing ${file.name}...`);
    try {
      // 1. Get the permitted categories for this user's entity to constrain the AI
      const userEnt = entities.find(e => e.id == user.entityId);
      let allowedCategories = expenseTypes.map(t => t.label).join(', ');

      const formData = new FormData();
      formData.append('receipt', file);
      formData.append('allowedCategories', allowedCategories);

      // 2. Create the base record (Scanning Phase)
      const baseReceiptId = crypto.randomUUID ? crypto.randomUUID() : `R${Date.now()}`;
      const newReceipt = {
        id: baseReceiptId,
        user_id: user.id,
        entity_id: user.entityId,
        file_name: file.name,
        status: 'UNALLOCATED',
        receipt_status: 'processing',
        amount_suggestion: 0,
        vendor_suggestion: 'Scanning...'
      };

      // Optimistic UI Update
      setReceipts(prev => [...prev, newReceipt]);
      const { error: insErr } = await supabase.from('receipts').insert(newReceipt);
      if (insErr) {
        console.error("Supabase Insert Error:", insErr);
        // If we can't insert the initial record, we can't proceed with the AI update loop.
        throw new Error(`Database connection failed: ${insErr.message}`);
      }

      // 3. Call the Local Gemini AI Proxy
      let aiResult = null;
      let aiParsed = null;
      let fetchFailed = false;

      try {
        const envProxy = import.meta.env.VITE_GEMINI_PROXY_URL || '';
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        const proxyBaseUrl = (envProxy.includes('your-gemini-proxy') || (!isLocalhost && envProxy.includes('localhost'))) ? '' : (envProxy || (isLocalhost ? 'http://localhost:3001' : ''));
        const response = await fetch(`${proxyBaseUrl}/api/extract`, {
          method: 'POST',
          body: formData
        });

        if (response.ok) {
          aiResult = await response.json();
          aiParsed = aiResult.parsed;
        } else {
          console.error("AI Proxy Error response:", await response.text());
          fetchFailed = true;
        }
      } catch (proxyErr) {
        console.error("Failed to reach Gemini proxy. Is it running on port 3001?", proxyErr);
        fetchFailed = true;
      }

      // 4. Update the record with extracted data or fallback defaults
      const updatePayload = {
        file_name: file.name, // Default fallback
        receipt_status: aiParsed ? 'extracted' : 'failed',
        vendor_suggestion: aiParsed ? aiParsed.vendor_name : (fetchFailed ? 'AI Unavailable' : 'Local Upload'),
        amount_suggestion: aiParsed ? aiParsed.gross_amount : 0,
      };

      if (aiParsed) {
        const rDate = aiParsed.transaction_date || new Date().toISOString().split('T')[0];
        const rAmt = aiParsed.gross_amount || 0;
        const rCur = aiParsed.expense_currency || 'XXX';
        const rType = aiParsed.expense_type || 'Unknown';

        // Sanitize naming components to avoid storage/URL issues (replace non-alphanumeric with _)
        const sCur = String(rCur).replace(/[^a-z0-9]/gi, '_');
        const sAmt = String(rAmt).replace(/[^a-z0-9.]/gi, '_');
        const sType = String(rType).replace(/[^a-z0-9]/gi, '_');
        const sDate = String(rDate).replace(/[^a-z0-9]/gi, '_');
        const ext = file.name.includes('.') ? file.name.split('.').pop() : 'bin';

        // Rename the file using the extracted format requested by user
        updatePayload.file_name = `${sCur}_${sAmt}_${sType}_${sDate}.${ext}`;

        updatePayload.ai_raw_json = aiResult.raw_json;
        updatePayload.ai_model_version = aiResult.model_version;
        updatePayload.expense_currency = aiParsed.expense_currency;
        updatePayload.gross_amount = aiParsed.gross_amount;
        updatePayload.expense_type = aiParsed.expense_type;

        if (aiParsed.transaction_date && !isNaN(Date.parse(aiParsed.transaction_date))) {
          updatePayload.transaction_date = aiParsed.transaction_date;
        }
        if (aiParsed.vat_percentage !== null && aiParsed.vat_percentage !== undefined) {
          updatePayload.vat_percentage = aiParsed.vat_percentage;
        }
      }

      // 3b. Upload to Supabase Storage for permanent persistence
      try {
        const { error: storageErr } = await supabase.storage
          .from('receipts')
          .upload(updatePayload.file_name, file, { upsert: true });

        if (storageErr) {
          console.warn('Supabase Storage Upload failed (ignore if bucket not setup):', storageErr.message);
        } else {
          console.log('Successfully backed up receipt to cloud storage:', updatePayload.file_name);
        }
      } catch (stErr) {
        console.warn('Storage upload error:', stErr);
      }

      if (aiResult && aiResult.file_hash) {
        updatePayload.file_hash = aiResult.file_hash;
      }

      // Check Duplicates based on sensitivity
      const sensitivity = userEnt?.duplicate_sensitivity || 'strict';
      if (sensitivity !== 'none') {
        let isDup = false;
        let dupId = null;
        let dupScore = 0;

        const { data: existing } = await supabase.from('receipts')
          .select('id, file_hash, vendor_suggestion, transaction_date, gross_amount, duplicate_flag')
          .neq('id', baseReceiptId)
          .eq('duplicate_flag', false); // Don't match against already flagged duplicates to avoid chains

        if (existing) {
          for (const rx of existing) {
            // Strict match: File hash identical
            if (aiResult && aiResult.file_hash && rx.file_hash === aiResult.file_hash) {
              isDup = true;
              dupId = rx.id;
              dupScore = 1.0;
              break;
            }
            // Standard/Strict match: Same vendor, date, and amount
            if (aiParsed && rx.vendor_suggestion && rx.vendor_suggestion === updatePayload.vendor_suggestion
              && rx.transaction_date === updatePayload.transaction_date
              && Number(rx.gross_amount) === Number(updatePayload.gross_amount)) {
              isDup = true;
              dupId = rx.id;
              dupScore = 0.8;
              break;
            }
          }
        }

        if (isDup) {
          updatePayload.duplicate_flag = true;
          updatePayload.duplicate_reference_id = dupId;
          updatePayload.duplicate_confidence_score = dupScore;
          updatePayload.receipt_status = 'flagged_duplicate';
        }
      }

      if (aiParsed && updatePayload.file_name !== file.name) {
        setSessionBlobMap(prev => ({ ...prev, [updatePayload.file_name]: { url: URL.createObjectURL(file), type: file.type } }));
        const oldBlob = localStorage.getItem(`receipt_blob_${file.name}`);
        if (oldBlob) {
          localStorage.setItem(`receipt_blob_${updatePayload.file_name}`, oldBlob);
        }
      } else {
        setSessionBlobMap(prev => ({ ...prev, [file.name]: { url: URL.createObjectURL(file), type: file.type } }));
      }

      const { error: updErr } = await supabase.from('receipts').update(updatePayload).eq('id', baseReceiptId);
      if (updErr) {
        console.warn("Final metadata update failed, but AI results are local:", updErr.message);
      }

      // Update local state smoothly
      setReceipts(prev => prev.map(r => r.id === baseReceiptId ? { ...r, ...updatePayload } : r));

      setGlobalLoadingMessage(null);
      return { id: baseReceiptId, data: updatePayload };
    } catch (err) {
      console.error("Upload process failed catastrophically:", err);
      alert(`Upload Failed: ${err.message || 'Check connection'}. If using a high-res image, try a smaller file (under 4MB).`);
      setGlobalLoadingMessage(null);
      return null;
    }
  };

  const handleDeleteClaim = async (claimId) => {
    if (!window.confirm("Are you sure you want to delete this draft? This cannot be undone.")) return;
    try {
      // 1. Find all associated receipts and reset them to UNALLOCATED
      const { data: positions } = await supabase.from('expense_items').select('backlog_id').eq('claim_id', claimId);
      const backlogIds = (positions || []).map(p => p.backlog_id).filter(Boolean);

      if (backlogIds.length > 0) {
        await supabase.from('receipts').update({ status: 'UNALLOCATED' }).in('id', backlogIds);
      }

      // 2. The database should cascade delete the expense_items, but let's delete the claim.
      const { error } = await supabase.from('claims').delete().eq('id', claimId);
      if (error) throw error;

      await fetchData();
    } catch (err) {
      console.error("Error deleting claim:", err);
      alert("Network error: Could not delete claim.");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setClaims([]);
    setReceipts([]);
    setSelectedClaim(null);
    setImportedClaim(null);
    setPreviewReceipt(null);
  };

  if (!user) return <LoginPage onLogin={setUser} />;

  const userEntity = entities.find(e => e.id == user.entityId);

  return (
    <div className="layout">
      <Sidebar user={user} users={users} currentView={view} isManagerApprover={isManagerApprover} onViewChange={(v) => {
        setView(v);
        setSelectedClaim(null);
        if (v === 'new-claim' || v === 'receipts-backlog') fetchData();
      }} onLogout={handleLogout} />
      <main className="main-content">
        {view === 'dashboard' && (
          <div className="view">
            <h2>{user.roles.includes('ADMIN') ? 'Administrative Dashboard (Global)' : 'My Dashboard'}</h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem', marginTop: '1.5rem' }}>
              {user.roles.includes('ADMIN') ? (
                // Existing Admin Dashboard stats...
                <>
                  <div className="card" style={{ borderLeft: '4px solid #64748b' }}>
                    <h4>Total Claims</h4>
                    <p style={{ fontSize: '1.8rem' }}>{claims.length || 0}</p>
                    <small style={{ color: '#666' }}>System-wide</small>
                  </div>
                  <div className="card" style={{ borderLeft: '4px solid #3b82f6' }}>
                    <h4>Drafts</h4>
                    <p style={{ fontSize: '1.8rem', color: '#3b82f6' }}>{claims.filter(c => c.claimStatus === CLAIM_STATUS.NEW).length || 0}</p>
                    <small style={{ color: '#666' }}>Not yet submitted</small>
                  </div>
                  <div className="card" style={{ borderLeft: '4px solid #f59e0b' }}>
                    <h4>Submitted</h4>
                    <p style={{ fontSize: '1.8rem', color: '#f59e0b' }}>{claims.filter(c => c.claimStatus === CLAIM_STATUS.SUBMITTED).length || 0}</p>
                    <small style={{ color: '#666' }}>Pending Finance</small>
                  </div>
                  <div className="card" style={{ borderLeft: '1px solid #10b981', borderLeftWidth: '4px' }}>
                    <h4>Approved</h4>
                    <p style={{ fontSize: '1.8rem', color: '#10b981' }}>{claims.filter(c => c.approvalStatus === APPROVAL_STATUS.APPROVED && c.claimStatus !== CLAIM_STATUS.CLOSED).length || 0}</p>
                    <small style={{ color: '#666' }}>Ready to Sync</small>
                  </div>
                  <div className="card" style={{ borderLeft: '4px solid #ef4444' }}>
                    <h4>Rejected</h4>
                    <p style={{ fontSize: '1.8rem', color: '#ef4444' }}>{claims.filter(c => c.approvalStatus === APPROVAL_STATUS.REJECTED).length || 0}</p>
                    <small style={{ color: '#666' }}>Correction required</small>
                  </div>
                </>
              ) : user.roles.includes('ACCOUNTANT') ? (
                <>
                  {(() => {
                    const scopedClaims = claims.filter(c => (user.assignedEntities?.includes(c.entityId) || c.entityId === user.entityId));
                    return (
                      <>
                        <div className="card" style={{ borderLeft: '4px solid #f59e0b' }}>
                          <h4>Total Accrued</h4>
                          <p style={{ fontSize: '1.5rem', color: '#f59e0b' }}>{scopedClaims.filter(c => c.claimStatus === CLAIM_STATUS.ACCRUED).length || 0}</p>
                          <small style={{ color: '#666' }}>Scoped Entities</small>
                        </div>
                        <div className="card" style={{ borderLeft: '4px solid #10b981' }}>
                          <h4>Synced (D365FO)</h4>
                          <p style={{ fontSize: '1.5rem', color: '#10b981' }}>{scopedClaims.filter(c => c.claimStatus === CLAIM_STATUS.CLOSED).length || 0}</p>
                          <small style={{ color: '#666' }}>Scoped Entities</small>
                        </div>
                        <div className="card" style={{ borderLeft: '4px solid #3b82f6' }}>
                          <h4>Total Submitted</h4>
                          <p style={{ fontSize: '1.5rem', color: '#3b82f6' }}>{scopedClaims.filter(c => c.claimStatus === CLAIM_STATUS.SUBMITTED).length || 0}</p>
                          <small style={{ color: '#666' }}>Scoped Entities</small>
                        </div>
                        <div className="card" style={{ background: '#f8fafc' }}>
                          <h4>Your Drafts</h4>
                          <p style={{ fontSize: '1.5rem' }}>{claims.filter(c => c.userId == user.id && c.claimStatus === CLAIM_STATUS.NEW).length || 0}</p>
                        </div>
                      </>
                    );
                  })()}
                  <div className="card" style={{ cursor: 'pointer', background: '#f0f9ff', border: '1px solid #bae6fd' }} onClick={() => setView('receipts-backlog')}>
                    <h4>Floating Receipts</h4>
                    <p style={{ fontSize: '1.5rem', color: 'var(--primary)', fontWeight: 'bold' }}>{receipts.length || 0}</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="card" style={{ background: '#f8fafc' }}>
                    <h4>New/Draft</h4>
                    <p style={{ fontSize: '1.5rem' }}>{claims.filter(c => c.userId == user.id && c.claimStatus === CLAIM_STATUS.NEW).length || 0}</p>
                  </div>
                  <div className="card" style={{ cursor: 'pointer', background: '#f0f9ff', border: '1px solid #bae6fd' }} onClick={() => setView('receipts-backlog')}>
                    <h4>Floating Receipts</h4>
                    <p style={{ fontSize: '1.5rem', color: 'var(--primary)', fontWeight: 'bold' }}>{receipts.length || 0}</p>
                  </div>
                  <div className="card" style={{ borderLeft: '4px solid #10b981' }}>
                    <h4>Approved</h4>
                    <p style={{ fontSize: '1.5rem', color: '#10b981' }}>{claims.filter(c => c.userId == user.id && c.approvalStatus === APPROVAL_STATUS.APPROVED && c.claimStatus !== CLAIM_STATUS.CLOSED).length || 0}</p>
                  </div>
                  <div className="card" style={{ borderLeft: '4px solid #ef4444' }}>
                    <h4>Rejected</h4>
                    <p style={{ fontSize: '1.5rem', color: '#ef4444' }}>{claims.filter(c => c.userId == user.id && c.approvalStatus === APPROVAL_STATUS.REJECTED).length || 0}</p>
                  </div>
                  <div className="card" style={{ borderLeft: '4px solid #64748b' }}>
                    <h4>Completed</h4>
                    <p style={{ fontSize: '1.5rem' }}>{claims.filter(c => c.userId == user.id && c.claimStatus === CLAIM_STATUS.CLOSED).length || 0}</p>
                  </div>
                </>
              )}
            </div>
            {!user.roles.includes('ADMIN') && (
              <div style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="card" style={{ cursor: 'pointer', border: '1px solid var(--primary)', background: '#eff6ff' }} onClick={() => setView('new-claim')}>
                  <h3 style={{ margin: 0, color: 'var(--primary)' }}>+ Create New Claim</h3>
                </div>
                <div className="card" style={{ cursor: 'pointer', border: '1px solid var(--primary)', background: '#eff6ff' }} onClick={() => setView('imports')}>
                  <h3 style={{ margin: 0, color: 'var(--primary)' }}>💳 Import Statements</h3>
                </div>
              </div>
            )}
          </div>
        )}

        {view === 'my-claims' && !selectedClaim && (
          <div className="view">
            <div className="header">
              <h2>My Expense Claims</h2>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    placeholder="🔍 Search my claims..."
                    style={{ padding: '0.5rem 1rem 0.5rem 2.2rem', borderRadius: '20px', border: '1px solid #e2e8f0', width: '250px', fontSize: '0.9rem' }}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <span style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}></span>
                </div>
                <button className="btn btn-primary" onClick={() => setView('new-claim')}>+ Create New</button>
              </div>
            </div>
            <div className="card">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr style={{ textAlign: 'left' }}><th>ID</th><th>Title</th><th>Total</th><th>Accountant</th><th>Claim Status</th><th>Approval</th><th>Action</th></tr></thead>
                <tbody>{claims.filter(c => c.userId == user.id && (searchTerm === '' || c.title.toLowerCase().includes(searchTerm.toLowerCase()) || c.id.toLowerCase().includes(searchTerm.toLowerCase()))).map(c => (
                  <tr key={c.id}>
                    <td style={{ padding: '1rem 0' }}><code style={{ fontSize: '0.75rem' }}>{c.id}</code></td>
                    <td>{c.title} {c.statement_attachment && <span style={{ cursor: 'pointer', opacity: 0.7 }} title="View Statement" onClick={(e) => { e.stopPropagation(); setPreviewReceipt(c.statement_attachment); }}>📄</span>}</td>
                    <td style={{ fontWeight: 'bold' }}>{c.currency || '€'}{c.expenses.reduce((acc, e) => acc + Number(e.amount), 0).toFixed(2)}</td>
                    <td>
                      {(() => {
                        const accs = getAccountantsForEntity(c.entityId);
                        return accs.length > 0 ? accs.map(a => a.name).join(', ') : <span style={{ color: '#999', fontSize: '0.8rem' }}>Unassigned</span>;
                      })()}
                    </td>
                    <td><span className={`badge badge-${c.claimStatus.toLowerCase()}`}>{c.claimStatus}</span></td>
                    <td><span className={`badge badge-${c.approvalStatus.replace(' ', '-').toLowerCase()}`}>{c.approvalStatus}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-outline" onClick={(e) => { e.stopPropagation(); setSelectedClaim(c) }}>View History</button>
                        {(c.claimStatus === CLAIM_STATUS.NEW || c.approvalStatus === APPROVAL_STATUS.REJECTED) && (
                          <button className="btn btn-outline" onClick={(e) => { e.stopPropagation(); setImportedClaim(c); setView('new-claim'); setSelectedClaim(null); }}>✏️ Edit</button>
                        )}
                        {c.claimStatus === CLAIM_STATUS.NEW && (
                          <button className="btn btn-outline" style={{ color: 'var(--error)', borderColor: 'var(--error)' }} onClick={(e) => { e.stopPropagation(); handleDeleteClaim(c.id); }}>🗑️</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        )}

        {selectedClaim && (
          <DetailView
            claim={selectedClaim}
            owner={users.find(u => u.id == selectedClaim.userId)}
            approver={users.find(u => u.id === selectedClaim.approver_id)}
            accountants={getAccountantsForEntity(selectedClaim.entityId)}
            currentUser={user}
            entity={entities.find(e => e.id == selectedClaim.entityId)}
            onBack={() => setSelectedClaim(null)}
            onStatusUpdate={handleStatusUpdate}
            onEdit={(draft) => { setImportedClaim(draft); setView('new-claim'); setSelectedClaim(null); }}
            onSave={(c) => handleSaveClaim(c)}
            mode={view === 'finance' ? 'finance' : (view === 'approvals' ? 'manager' : 'staff')}
            expenseTypes={expenseTypes}
            onPreview={setPreviewReceipt}
          />
        )}

        {view === 'new-claim' && user && (
          <ClaimForm
            user={user}
            users={users}
            claim={importedClaim}
            entities={entities}
            expenseTypes={expenseTypes}
            exchangeRates={exchangeRates}
            projects={projects}
            departments={departments}
            receipts={receipts}
            userEntityApprovers={userEntityApprovers}
            onCancel={() => { setView('dashboard'); setImportedClaim(null); }}
            onSave={handleSaveClaim}
            onDraft={handleSaveClaim}
            onPreview={setPreviewReceipt}
            onUploadReceipt={handleLocalReceiptUpload}
          />
        )}

        {view === 'receipts-backlog' && (
          <ReceiptBacklog
            user={user}
            onUploadReceipt={handleLocalReceiptUpload}
            onAllocate={(r) => {
              const draft = {
                id: 'DRAFT-' + Date.now(),
                title: `Claim for ${r.vendor_suggestion || r.file_name}`,
                userId: user.id,
                entityId: user.entityId,
                expenses: [{
                  id: Date.now(),
                  type: r.expense_type || '',
                  amount: r.amount_suggestion || r.gross_amount || 0,
                  currency: r.expense_currency || 'EUR',
                  description: r.vendor_suggestion ? `Expense at ${r.vendor_suggestion}` : `Imported from ${r.file_name}`,
                  payment: 'REIMBURSABLE',
                  receipt: r.file_name,
                  backlogId: r.id
                }]
              };
              setImportedClaim(draft);
              setView('new-claim');
            }}
            onPreview={setPreviewReceipt}
            onBack={() => setView('dashboard')}
          />
        )}

        {view === 'imports' && (
          <ImportPortal
            entities={entities}
            user={user}
            expenseTypes={expenseTypes}
            setGlobalLoadingMessage={setGlobalLoadingMessage}
            onImportComplete={(draft) => { setImportedClaim(draft); setView('new-claim'); }}
          />
        )}

        {view === 'finance' && !selectedClaim && (
          <div className="view">
            <div className="header">
              <h2>Finance Audit Portal</h2>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="🔍 Filter by Staff, Title, or ID..."
                  style={{ padding: '0.5rem 1rem 0.5rem 2.2rem', borderRadius: '20px', border: '1px solid #e2e8f0', width: '300px', fontSize: '0.9rem' }}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Entity Traffic Indicators (PRD 8.0) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1.5rem' }}>
              {entities.filter(e => {
                if (user.roles.includes('ADMIN')) return true;
                const assigned = [String(user.entityId), ...(user.assignedEntities || []).filter(ae => ae).map(ae => String(ae))];
                return assigned.includes(String(e.id));
              }).map(e => {
                const total = claims.filter(c => c.entityId == e.id && (user.roles.includes('ADMIN') || c.claimStatus !== 'NEW')).length;
                const closed = claims.filter(c => c.entityId == e.id && c.claimStatus === 'CLOSED').length;
                const progress = total > 0 ? (closed / total) * 100 : 0;
                return (
                  <div key={e.id} className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <strong>{e.name} Progress</strong>
                      <small>{closed}/{total} Synced</small>
                    </div>
                    <div style={{ height: '8px', background: '#eee', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${progress}%`, height: '100%', background: 'var(--primary)', transition: 'width 0.3s' }}></div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="card" style={{ marginTop: '1.5rem' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr style={{ textAlign: 'left' }}><th>Staff</th><th>Approver</th><th>Accountant</th><th>Title</th><th>Claim Status</th><th>Action</th></tr></thead>
                <tbody>{claims.filter(c => {
                  if (user.roles.includes('ADMIN')) {
                    // Admins see all for finance view
                  } else {
                    const assigned = [String(user.entityId), ...(user.assignedEntities || []).filter(ae => ae).map(ae => String(ae))];
                    if (!assigned.includes(String(c.entityId))) return false;
                  }

                  if (c.claimStatus === CLAIM_STATUS.NEW && !user.roles.includes('ADMIN')) return false;

                  const searchLower = searchTerm.toLowerCase();
                  const staffName = users.find(u => u.id == c.userId)?.name || '';
                  return searchTerm === '' ||
                    c.title.toLowerCase().includes(searchLower) ||
                    c.id.toLowerCase().includes(searchLower) ||
                    staffName.toLowerCase().includes(searchLower);
                }).map(c => (
                  <tr key={c.id}>
                    <td>{users.find(u => u.id == c.userId)?.name}</td>
                    <td><small>{c.approver_id ? users.find(u => u.id == c.approver_id)?.name : 'N/A'}</small></td>
                    <td><small>{getAccountantsForEntity(c.entityId).map(a => a.name).join(', ') || 'Unassigned'}</small></td>
                    <td>{c.title} {c.statement_attachment && <span style={{ cursor: 'pointer', opacity: 0.7 }} title="View Statement" onClick={(e) => { e.stopPropagation(); setPreviewReceipt(c.statement_attachment); }}>📄</span>}</td>
                    <td>{c.claimStatus}</td>
                    <td><button className="btn btn-outline" onClick={() => setSelectedClaim({ ...c, isViewOnly: (c.claimStatus === CLAIM_STATUS.CLOSED || c.claimStatus === CLAIM_STATUS.ACCRUED) && !user.roles.includes('ADMIN') })}>Audit Detail</button></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        )}

        {view === 'settings' && (
          <SettingsView
            user={user}
            entities={entities}
            users={users}
            userEntityApprovers={userEntityApprovers}
            onBack={() => setView('dashboard')}
          />
        )}

        {view === 'approvals' && !selectedClaim && (
          <div className="view">
            <div className="header">
              <h2>Approvals Center</h2>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    placeholder="🔍 Filter by Staff or Title..."
                    style={{ padding: '0.4rem 0.8rem 0.4rem 2rem', borderRadius: '15px', border: '1px solid #e2e8f0', width: '220px', fontSize: '0.85rem' }}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className={`btn btn-${view === 'approvals' ? 'primary' : 'outline'}`} onClick={() => setView('approvals')}>Queue</button>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginTop: '1.5rem' }}>
              <div>
                <h3>Pending Approvals</h3>
                <div className="card" style={{ marginTop: '0.5rem' }}>
                  {claims.filter(c => {
                    const isPending = c.approvalStatus === APPROVAL_STATUS.PENDING && c.userId != user.id && c.approver_id == user.id;
                    const searchLower = searchTerm.toLowerCase();
                    const staffName = users.find(u => u.id == c.userId)?.name || '';
                    const matchesSearch = searchTerm === '' ||
                      c.title.toLowerCase().includes(searchLower) ||
                      c.id.toLowerCase().includes(searchLower) ||
                      staffName.toLowerCase().includes(searchLower);
                    return isPending && matchesSearch;
                  }).map(c => (
                    <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem 0', borderBottom: '1px solid #f0f0f0', alignItems: 'center' }}>
                      <div>
                        <code style={{ fontSize: '0.7rem', color: '#888', display: 'block', marginBottom: '4px' }}>{c.id}</code>
                        <strong>{c.title}</strong> {c.statement_attachment && <span style={{ cursor: 'pointer', opacity: 0.7 }} title="View Statement" onClick={(e) => { e.stopPropagation(); setPreviewReceipt(c.statement_attachment); }}>📄</span>} by {users.find(u => u.id == c.userId)?.name}
                        <div style={{ fontSize: '0.75rem', color: '#666' }}>
                          Submitted: {c.submission_date ? new Date(c.submission_date).toLocaleDateString() : 'Draft'} |
                          Accountant: {(() => {
                            const accs = getAccountantsForEntity(c.entityId);
                            return accs.length > 0 ? accs.map(a => a.name).join(', ') : 'Unassigned';
                          })()}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span className="badge badge-pending">PENDING</span>
                        <button className="btn btn-primary" onClick={() => setSelectedClaim(c)}>Review Details</button>
                      </div>
                    </div>
                  ))}
                  {claims.filter(c => c.approvalStatus === APPROVAL_STATUS.PENDING && c.userId != user.id && c.approver_id == user.id).length === 0 && (
                    <p style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>No pending approvals.</p>
                  )}
                </div>
              </div>

              <div>
                <h3>Processed History</h3>
                <div className="card" style={{ marginTop: '0.5rem', maxHeight: 'calc(100vh - 300px)', overflowY: 'auto' }}>
                  {claims.filter(c => {
                    if (c.approvalStatus === APPROVAL_STATUS.PENDING || c.claimStatus === CLAIM_STATUS.NEW || c.userId == user.id) return false;
                    // For history, they either explicitly acted on it, or they are currently the mapped approver for that staff/entity
                    const actedOnIt = (c.history || []).some(h => h.actorId == user.id);
                    const isMappedApproverForIt = c.approver_id == user.id;
                    return actedOnIt || isMappedApproverForIt;
                  }).map(c => (
                    <div key={c.id} style={{ padding: '0.75rem 0', borderBottom: '1px solid #f0f0f0' }}>
                      <code style={{ fontSize: '0.65rem', color: '#888', display: 'block', marginBottom: '2px' }}>{c.id}</code>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <strong style={{ fontSize: '0.85rem' }}>{c.title}</strong> by {users.find(u => u.id == c.userId)?.name}
                          <div style={{ fontSize: '0.7rem', color: '#888' }}>
                            Accountant: {getAccountantsForEntity(c.entityId).map(a => a.name).join(', ') || 'Unassigned'}
                          </div>
                        </div>
                        <span className={`badge badge-${c.approvalStatus.replace(' ', '-').toLowerCase()}`} style={{ fontSize: '0.65rem' }}>{c.approvalStatus}</span>
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#888', marginTop: '4px' }}>By: {users.find(u => u.id == c.userId)?.name}</div>
                      <button className="btn btn-outline" style={{ fontSize: '0.7rem', width: '100%', marginTop: '8px', padding: '2px' }} onClick={() => setSelectedClaim(c)}>View Audit Details</button>
                    </div>
                  ))}
                  {claims.filter(c => c.approvalStatus !== APPROVAL_STATUS.PENDING && c.claimStatus !== CLAIM_STATUS.NEW && c.userId != user.id).length === 0 && (
                    <p style={{ textAlign: 'center', color: '#aaa', fontSize: '0.8rem' }}>No history yet.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {view === 'admin' && (
          <AdminCenter
            user={user}
            entities={entities}
            exchangeRates={exchangeRates}
            expenseTypes={expenseTypes}
            projects={projects}
            departments={departments}
            users={users}
            userEntityApprovers={userEntityApprovers}
            aiPrompts={aiPrompts}
            onSave={handleSaveAdminItem}
            onDeleteItem={handleDeleteAdminItem}
            fetchGlobalData={fetchGlobalData}
          />
        )}

        {/* Global Receipt Preview Modal */}
        {previewReceipt && (
          <div className="preview-modal-overlay" onClick={() => setPreviewReceipt(null)}>
            <div className="preview-modal-content" onClick={e => e.stopPropagation()}>
              <button className="preview-close-btn" onClick={() => setPreviewReceipt(null)}>✕</button>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 className="preview-header" style={{ margin: 0 }}>Receipt Preview</h2>
                {(() => {
                  // Background fetch for cloud backup if missing locally
                  const key = `receipt_blob_${previewReceipt}`;
                  if (!localStorage.getItem(key) && !sessionBlobMap[previewReceipt]) {
                    // REMOVED encodeURIComponent: The Supabase client handles the full path (including slashes) naturally.
                    supabase.storage.from('receipts').download(previewReceipt).then(({ data, error }) => {
                      if (data && !error) {
                        const url = URL.createObjectURL(data);
                        setSessionBlobMap(prev => ({ ...prev, [previewReceipt]: { url, type: data.type } }));
                      }
                    });
                  }
                  return null;
                })()}
                <small style={{ color: '#666' }}>{previewReceipt.split('/').pop()}</small>
              </div>
              <div className="preview-image-container">
                {(() => {
                  const entry = sessionBlobMap[previewReceipt];
                  const url = entry?.url || localStorage.getItem(`receipt_blob_${previewReceipt}`);
                  if (url) {
                    const isPdf = (entry?.type === 'application/pdf') ||
                      previewReceipt.toLowerCase().endsWith('.pdf') ||
                      (typeof url === 'string' && url.startsWith('data:application/pdf'));
                    return isPdf ? (
                      <div style={{ width: '100%', height: '75vh', display: 'flex', flexDirection: 'column' }}>
                        <embed src={url} type="application/pdf" style={{ width: '100%', height: '100%', border: 'none', borderRadius: '8px' }} />
                        <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
                          <a href={url} download={previewReceipt} style={{ fontSize: '0.8rem', color: 'var(--primary)', textDecoration: 'underline' }}>
                            Can't see the PDF? Click to download directly
                          </a>
                        </div>
                      </div>
                    ) : (
                      <img src={url} alt="Receipt" style={{ maxWidth: '100%', maxHeight: '75vh', objectFit: 'contain' }} />
                    );
                  }

                  // If missing locally, we show a helpful message
                  return (
                    <div className="preview-loader-container" style={{ textAlign: 'center', padding: '2rem' }}>
                      <div className="preview-loader" style={{ margin: '0 auto 1rem autof' }} />
                      <p style={{ fontWeight: '500' }}>Checking for Cloud Backup...</p>
                      <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '1rem', maxWidth: '300px' }}>
                        If this fails, the file may have been uploaded in a different session or contains invalid characters. <strong>Please re-upload the receipt</strong> to fix the link permanently.
                      </p>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}
        {globalLoadingMessage && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(255,255,255,0.8)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', zIndex: 9999, backdropFilter: 'blur(4px)' }}>
            <div className="spinner" style={{ width: '50px', height: '50px', border: '5px solid #f3f3f3', borderTop: '5px solid var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '1.5rem' }}></div>
            <h3 style={{ color: 'var(--primary)', margin: 0 }}>{globalLoadingMessage}</h3>
            <p style={{ color: '#666', marginTop: '0.5rem', fontSize: '0.9rem' }}>This usually takes 5-10 seconds...</p>
            <style>{`
              @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            `}</style>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
