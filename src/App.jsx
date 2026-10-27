import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { MobileFrame } from './components/mobile/MobileFrame';
import { MobileHeader } from './components/mobile/MobileHeader';
import { MobileBottomNav } from './components/mobile/MobileBottomNav';
import { OfflineBanner } from './components/mobile/OfflineBanner';
import { PWAInstallModal } from './components/mobile/PWAInstallModal';
import { DeploymentInstallerModal } from './components/mobile/DeploymentInstallerModal';
import { AdminLoginScreen } from './components/auth/AdminLoginScreen';
import { TwoFactorChallenge } from './components/auth/TwoFactorChallenge';
import { LockScreenModal } from './components/auth/LockScreenModal';
import { DashboardTab } from './components/dashboard/DashboardTab';
import { LeadsTab } from './components/leads/LeadsTab';
import { LeadModal } from './components/leads/LeadModal';
import { PortfolioTab } from './components/portfolio/PortfolioTab';
import { ProjectModal } from './components/portfolio/ProjectModal';
import { SecurityTab } from './components/security/SecurityTab';
import { InvoicesTab } from './components/invoices/InvoicesTab';
import { api } from './services/api';
import { AdminManagementPanel } from './components/admin/AdminManagementPanel.jsx';
import { getStoredLeads, saveStoredLeads, getStoredProjects, saveStoredProjects } from './utils/storage';
const MainApp = () => {
    const { isAuthenticated, pending2FA } = useAuth();
    const [currentTab, setCurrentTab] = useState('dashboard');
    // Leads & Portfolio State - ZERO SEEDED DEMO DATA
    const [leads, setLeads] = useState(() => getStoredLeads());
    const [projects, setProjects] = useState(() => getStoredProjects());
    const [loadingData, setLoadingData] = useState(false);
    // Modals
    const [activeLeadModal, setActiveLeadModal] = useState({ isOpen: false, lead: null });
    const [activeProjectModal, setActiveProjectModal] = useState({ isOpen: false, project: null });
    const [showInstallerGuide, setShowInstallerGuide] = useState(false);
    // Load real data from MongoDB when authenticated
    useEffect(() => {
        if (!isAuthenticated)
            return;
        let mounted = true;
        setLoadingData(true);
        Promise.all([api.getLeads(), api.getProjects()])
            .then(([dbLeads, dbProjects]) => {
            if (mounted) {
                setLeads(dbLeads);
                setProjects(dbProjects);
                saveStoredLeads(dbLeads);
                saveStoredProjects(dbProjects);
            }
        })
            .catch(() => {
                // Network unavailable: keep the last successful server snapshot on this device.
                if (mounted) { setLeads(getStoredLeads()); setProjects(getStoredProjects()); }
            })
            .finally(() => {
            if (mounted)
                setLoadingData(false);
        });
        return () => {
            mounted = false;
        };
    }, [isAuthenticated]);
    // Client and project changes are only reflected after the database confirms success.
    const handleSaveLead = async (leadData) => {
        try {
            if (leadData._id && leads.some((l) => l._id === leadData._id)) {
                const updated = await api.updateLead(leadData._id, leadData);
                setLeads((prev) => { const next = prev.map((l) => (l._id === leadData._id ? updated : l)); saveStoredLeads(next); return next; });
            }
            else {
                const created = await api.createLead(leadData);
                setLeads((prev) => { const next = [created, ...prev]; saveStoredLeads(next); return next; });
            }
        }
        catch (err) {
            console.error('Failed to save lead in database:', err);
            window.alert(err instanceof Error ? `Client was not saved: ${err.message}` : 'Client was not saved because the database request failed.');
        }
    };
    const handleDeleteLead = async (id) => {
        try {
            await api.deleteLead(id);
            setLeads((prev) => { const next = prev.filter((l) => l._id !== id); saveStoredLeads(next); return next; });
        }
        catch (err) {
            console.error('Failed to delete lead from database:', err);
            window.alert(err instanceof Error ? `Client was not deleted: ${err.message}` : 'Client was not deleted because the database request failed.');
        }
    };
    const handleUpdateLeadStatus = async (id, newStatus) => {
        try {
            const updated = await api.updateLead(id, { status: newStatus });
            setLeads((prev) => { const next = prev.map((l) => (l._id === id ? updated : l)); saveStoredLeads(next); return next; });
        }
        catch (err) {
            console.error('Failed to update lead status in database:', err);
            window.alert(err instanceof Error ? `Client status was not updated: ${err.message}` : 'Client status was not updated because the database request failed.');
        }
    };
    const handleSaveProject = async (projectData) => {
        try {
            if (projectData._id && projects.some((p) => p._id === projectData._id)) {
                const updated = await api.updateProject(projectData._id, projectData);
                setProjects((prev) => { const next = prev.map((p) => (p._id === projectData._id ? updated : p)); saveStoredProjects(next); return next; });
            }
            else {
                const created = await api.createProject(projectData);
                setProjects((prev) => { const next = [created, ...prev]; saveStoredProjects(next); return next; });
            }
        }
        catch (err) {
            console.error('Failed to save project in database:', err);
            throw err;
        }
    };
    const handleDeleteProject = async (id) => {
        try {
            await api.deleteProject(id);
            setProjects((prev) => { const next = prev.filter((p) => p._id !== id); saveStoredProjects(next); return next; });
        }
        catch (err) {
            console.error('Failed to delete project from database:', err);
            window.alert(err instanceof Error ? `Project was not deleted: ${err.message}` : 'Project was not deleted because the database request failed.');
        }
    };
    const newLeadsCount = leads.filter((l) => l.status === 'new').length;
    // Unauthenticated Flow
    if (!isAuthenticated) {
        return (_jsxs(MobileFrame, { children: [_jsx(OfflineBanner, {}), pending2FA ? _jsx(TwoFactorChallenge, {}) : _jsx(AdminLoginScreen, {}), _jsx(DeploymentInstallerModal, { isOpen: showInstallerGuide, onClose: () => setShowInstallerGuide(false) })] }));
    }
    // Authenticated Owner Mobile App
    return (_jsx(MobileFrame, { children: _jsxs("div", { className: "flex-1 flex flex-col h-full bg-[#0c0d10] text-[#f2ede4] relative", children: [_jsx(MobileHeader, { onOpenDeploymentGuide: () => setShowInstallerGuide(true) }), _jsx(OfflineBanner, {}), _jsx(PWAInstallModal, {}), _jsxs("main", { className: "flex-1 flex flex-col overflow-hidden relative", children: [currentTab === 'dashboard' && (_jsx(DashboardTab, { leads: leads, projects: projects, onSelectTab: setCurrentTab, onOpenAddLead: () => setActiveLeadModal({ isOpen: true, lead: null }), onOpenAddProject: () => setActiveProjectModal({ isOpen: true, project: null }), onOpenDeploymentGuide: () => setShowInstallerGuide(true) })), currentTab === 'leads' && (_jsx(LeadsTab, { leads: leads, onOpenAdd: () => setActiveLeadModal({ isOpen: true, lead: null }), onOpenEdit: (lead) => setActiveLeadModal({ isOpen: true, lead }), onUpdateStatus: handleUpdateLeadStatus })), currentTab === 'portfolio' && (_jsx(PortfolioTab, { projects: projects, onOpenAdd: () => setActiveProjectModal({ isOpen: true, project: null }), onOpenEdit: (proj) => setActiveProjectModal({ isOpen: true, project: proj }), onDeleteProject: handleDeleteProject })), currentTab === 'invoices' && _jsx(InvoicesTab, { leads: leads }), currentTab === 'security' && (_jsxs('div', { className: 'flex-1 overflow-y-auto', children: [_jsx(SecurityTab, { onOpenDeploymentGuide: () => setShowInstallerGuide(true) }), _jsx(AdminManagementPanel, {})] }))] }), _jsx(MobileBottomNav, { currentTab: currentTab, onSelectTab: setCurrentTab, newLeadsCount: newLeadsCount }), _jsx(LeadModal, { isOpen: activeLeadModal.isOpen, lead: activeLeadModal.lead, onClose: () => setActiveLeadModal({ isOpen: false, lead: null }), onSave: handleSaveLead, onDelete: handleDeleteLead }), _jsx(ProjectModal, { isOpen: activeProjectModal.isOpen, project: activeProjectModal.project, onClose: () => setActiveProjectModal({ isOpen: false, project: null }), onSave: handleSaveProject, onDelete: handleDeleteProject }), _jsx(DeploymentInstallerModal, { isOpen: showInstallerGuide, onClose: () => setShowInstallerGuide(false) }), _jsx(LockScreenModal, {})] }) }));
};
export default function App() {
    return (_jsx(AuthProvider, { children: _jsx(MainApp, {}) }));
}
