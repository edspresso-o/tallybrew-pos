import React, { useState } from 'react';
import SettingsShift from './SettingsShift';
import SettingsSecurity from './SettingsSecurity';
import SettingsHistory from './SettingsHistory';
import SettingsLocations from './SettingsLocations';
import SettingsStaff from './SettingsStaff';

export default function Settings({ activeCashier, activeShift, onUpdateShift, onPrepareEndShift, branchId }) {
  const [activeTab, setActiveTab] = useState('shift');

  const isAdmin = activeCashier?.role === 'admin' || activeCashier?.role === 'manager';

  return (
    <div style={{ padding: '40px', paddingTop: '60px', backgroundColor: '#FDFBF7', minHeight: '100vh', width: '100%', fontFamily: "'Inter', sans-serif", boxSizing: 'border-box' }}>
      
      {/* HEADER */}
      <div style={{ marginBottom: '30px', textAlign: 'left' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#3B2213', margin: '0 0 5px 0', letterSpacing: '-0.5px' }}>
          Account Settings
        </h1>
        <p style={{ color: '#6b7280', fontSize: '15px', margin: 0, fontWeight: '500' }}>
          Manage your profile, active register, and system logs.
        </p>
      </div>

      {/* TAB NAVIGATION */}
      <div style={{ display: 'flex', justifyContent: 'flex-start', gap: '30px', borderBottom: '2px solid #e5e7eb', marginBottom: '30px', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <div onClick={() => setActiveTab('shift')} style={{ paddingBottom: '12px', cursor: 'pointer', fontWeight: '800', fontSize: '15px', whiteSpace: 'nowrap', color: activeTab === 'shift' ? '#B56124' : '#9ca3af', borderBottom: activeTab === 'shift' ? '3px solid #B56124' : '3px solid transparent', transition: 'all 0.2s' }}>My Shift</div>
        <div onClick={() => setActiveTab('security')} style={{ paddingBottom: '12px', cursor: 'pointer', fontWeight: '800', fontSize: '15px', whiteSpace: 'nowrap', color: activeTab === 'security' ? '#B56124' : '#9ca3af', borderBottom: activeTab === 'security' ? '3px solid #B56124' : '3px solid transparent', transition: 'all 0.2s' }}>Security PIN</div>
        
        {isAdmin && (
          <>
            <div onClick={() => setActiveTab('history')} style={{ paddingBottom: '12px', cursor: 'pointer', fontWeight: '800', fontSize: '15px', whiteSpace: 'nowrap', color: activeTab === 'history' ? '#B56124' : '#9ca3af', borderBottom: activeTab === 'history' ? '3px solid #B56124' : '3px solid transparent', transition: 'all 0.2s' }}>Shift History</div>
            <div onClick={() => setActiveTab('locations')} style={{ paddingBottom: '12px', cursor: 'pointer', fontWeight: '800', fontSize: '15px', whiteSpace: 'nowrap', color: activeTab === 'locations' ? '#B56124' : '#9ca3af', borderBottom: activeTab === 'locations' ? '3px solid #B56124' : '3px solid transparent', transition: 'all 0.2s' }}>Manage Locations</div>
            <div onClick={() => setActiveTab('staff')} style={{ paddingBottom: '12px', cursor: 'pointer', fontWeight: '800', fontSize: '15px', whiteSpace: 'nowrap', color: activeTab === 'staff' ? '#B56124' : '#9ca3af', borderBottom: activeTab === 'staff' ? '3px solid #B56124' : '3px solid transparent', transition: 'all 0.2s' }}>Manage Staff</div>
          </>
        )}
      </div>

      {/* TAB ROUTING */}
      {activeTab === 'shift' && <SettingsShift activeCashier={activeCashier} activeShift={activeShift} onUpdateShift={onUpdateShift} onPrepareEndShift={onPrepareEndShift} />}
      {activeTab === 'security' && <SettingsSecurity activeCashier={activeCashier} />}
      {activeTab === 'history' && isAdmin && <SettingsHistory branchId={branchId} />}
      {activeTab === 'locations' && isAdmin && <SettingsLocations />}
      {activeTab === 'staff' && isAdmin && <SettingsStaff activeCashier={activeCashier} branchId={branchId} />}

    </div>
  );
}