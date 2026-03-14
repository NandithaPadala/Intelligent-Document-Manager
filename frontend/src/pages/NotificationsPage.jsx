// NotificationsPage.jsx
import React, { useState, useEffect } from 'react';
import { Bell, AlertTriangle, Calendar, FileText, ExternalLink } from 'lucide-react';
import './NotificationsPage.css';

const NotificationsPage = () => {
    const [expiringDocs, setExpiringDocs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const response = await fetch('http://localhost:8000/notifications');
            if (!response.ok) {
                throw new Error('Failed to fetch notifications');
            }
            const data = await response.json();
            setExpiringDocs(data.expiring_documents || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const calculateDaysLeft = (expiryDateStr) => {
        if (!expiryDateStr) return 0;
        const expiryDate = new Date(expiryDateStr);
        const today = new Date();

        // Reset time portions for accurate day calc
        expiryDate.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);

        const diffTime = expiryDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    return (
        <div className="notifications-page animate-fade-in">
            <div className="notifications-header">
                <h1 className="page-title">Notifications</h1>
                <p>Documents expiring soon will appear here.</p>
            </div>

            {isLoading && (
                <div className="loading-state glass-panel">
                    <div className="loader"></div>
                    <p>Checking for expiring documents...</p>
                </div>
            )}

            {error && (
                <div className="error-message glass-panel" style={{ color: 'var(--danger)', padding: '2rem', textAlign: 'center' }}>
                    <AlertTriangle size={48} style={{ margin: '0 auto 1rem' }} />
                    <h3>Error Loading Notifications</h3>
                    <p>{error}</p>
                </div>
            )}

            {!isLoading && !error && expiringDocs.length === 0 && (
                <div className="empty-state glass-panel">
                    <Bell className="empty-icon" />
                    <h3>All caught up!</h3>
                    <p>You have no documents expiring in the next 7 days.</p>
                </div>
            )}

            {!isLoading && !error && expiringDocs.length > 0 && (
                <div className="notifications-list">
                    <div className="notifications-summary glass-panel">
                        <AlertTriangle className="warning-icon" size={24} />
                        <div>
                            <h3>Action Required</h3>
                            <p>You have {expiringDocs.length} document{expiringDocs.length > 1 ? 's' : ''} approaching expiration.</p>
                        </div>
                    </div>

                    {expiringDocs.map((doc, index) => {
                        const daysLeft = calculateDaysLeft(doc.expiry_date);
                        const isUrgent = daysLeft <= 3;

                        return (
                            <div key={index} className={`notification-card glass-panel ${isUrgent ? 'urgent' : ''}`}>
                                <div className="notification-icon-wrapper">
                                    <FileText className="notification-icon" />
                                </div>

                                <div className="notification-content">
                                    <h4 className="notification-title">{doc.filename}</h4>
                                    <div className="notification-details">
                                        <span className="expiry-date">
                                            <Calendar size={14} />
                                            Expires: {doc.expiry_date}
                                        </span>
                                        <span className={`days-left badge ${isUrgent ? 'badge-danger' : 'badge-warning'}`}>
                                            {daysLeft < 0 ? 'Expired' : daysLeft === 0 ? 'Expires Today' : `Expires in ${daysLeft} days`}
                                        </span>
                                    </div>
                                </div>

                                <a
                                    href={doc.url || `http://localhost:8000/documents/${doc.filename}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="btn btn-secondary btn-small"
                                >
                                    View Document
                                    <ExternalLink size={14} />
                                </a>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default NotificationsPage;
