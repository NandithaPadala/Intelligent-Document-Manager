// DocumentsPage.jsx
import React, { useState, useEffect } from 'react';
import { FileText, Download, Calendar, Tag, HardDrive, AlertCircle, Trash2 } from 'lucide-react';
import './DocumentsPage.css';

const DocumentsPage = () => {
    const [documents, setDocuments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchDocuments();
    }, []);

    const fetchDocuments = async () => {
        try {
            const response = await fetch('http://localhost:8000/documents');
            if (!response.ok) {
                throw new Error('Failed to fetch documents');
            }
            const data = await response.json();
            setDocuments(data.documents || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownload = (filename) => {
        window.open(`http://localhost:8000/documents/${filename}`, '_blank');
    };

    const handleDelete = async (filename) => {
        if (!window.confirm(`Are you sure you want to delete "${filename}"?`)) return;

        try {
            const response = await fetch(`http://localhost:8000/documents/${encodeURIComponent(filename)}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                let errMessage = 'Failed to delete document';
                try {
                    const errorData = await response.json();
                    if (errorData.detail) errMessage = errorData.detail;
                } catch (e) { }
                throw new Error(errMessage);
            }

            setDocuments(prevDocs => prevDocs.filter(doc => doc.filename !== filename));
        } catch (err) {
            alert(`Error: ${err.message}`);
        }
    };

    return (
        <div className="documents-page animate-fade-in">
            <div className="documents-header">
                <h1 className="page-title">My Documents</h1>
                <p>View and manage all your uploaded documents.</p>
            </div>

            {isLoading && (
                <div className="loading-state glass-panel">
                    <div className="loader"></div>
                    <p>Loading documents...</p>
                </div>
            )}

            {error && (
                <div className="error-message glass-panel" style={{ color: 'var(--danger)', padding: '2rem', textAlign: 'center' }}>
                    <AlertCircle size={48} style={{ margin: '0 auto 1rem' }} />
                    <h3>Error Loading Documents</h3>
                    <p>{error}</p>
                </div>
            )}

            {!isLoading && !error && documents.length === 0 && (
                <div className="empty-state glass-panel">
                    <HardDrive className="empty-icon" />
                    <h3>No documents found</h3>
                    <p>You haven't uploaded any documents yet. Go to the Upload page to add your first document.</p>
                </div>
            )}

            {!isLoading && !error && documents.length > 0 && (
                <div className="documents-grid">
                    {documents.map((doc, index) => (
                        <div key={index} className="document-card glass-panel flex flex-col">
                            <div className="document-icon">
                                <FileText size={24} />
                            </div>
                            <h3 className="document-title" title={doc.filename}>{doc.filename}</h3>

                            <div className="document-meta">
                                <div className="meta-item">
                                    <Tag className="meta-icon" />
                                    <span>{doc.doc_type || 'Unknown Type'}</span>
                                </div>
                                {doc.expiry_date && (
                                    <div className="meta-item">
                                        <Calendar className="meta-icon" />
                                        <span>Expires: {doc.expiry_date}</span>
                                    </div>
                                )}
                            </div>

                            <div className="document-actions">
                                <button
                                    className="btn btn-secondary view-btn"
                                    onClick={() => {
                                        if (doc.url) window.open(doc.url, '_blank');
                                        else handleDownload(doc.filename);
                                    }}
                                    style={{ flex: 1 }}
                                >
                                    <Download size={18} />
                                    View
                                </button>
                                <button
                                    className="btn btn-secondary delete-btn"
                                    onClick={() => handleDelete(doc.filename)}
                                    title="Delete Document"
                                    style={{ padding: '0.5rem 0.75rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default DocumentsPage;
