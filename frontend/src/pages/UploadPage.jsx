import { useState } from 'react';
import { UploadCloud, File, AlertCircle, CheckCircle } from 'lucide-react';
import axios from 'axios';
import './UploadPage.css';

const UploadPage = () => {
    const [file, setFile] = useState(null);
    const [status, setStatus] = useState('idle'); // idle, uploading, success, error
    const [message, setMessage] = useState('');

    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            setFile(e.target.files[0]);
            setStatus('idle');
            setMessage('');
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        if (e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
            setStatus('idle');
            setMessage('');
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file) {
            setStatus('error');
            setMessage('Please select a file to upload.');
            return;
        }

        setStatus('uploading');

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await axios.post('http://127.0.0.1:8000/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            setStatus('success');
            setMessage(response.data.message || 'File uploaded successfully!');
            setFile(null);
        } catch (error) {
            console.error('Upload Error:', error);
            setStatus('error');
            setMessage(error.response?.data?.detail || 'An error occurred during upload.');
        }
    };

    return (
        <div className="upload-page animate-fade-in">
            <h1 className="page-title">Upload Document</h1>

            <div className="upload-container glass-panel">
                <form onSubmit={handleUpload}>

                    <div
                        className={`drop-zone ${file ? 'has-file' : ''}`}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        onClick={() => document.getElementById('file-input').click()}
                    >
                        <input
                            type="file"
                            id="file-input"
                            className="hidden-input"
                            onChange={handleFileChange}
                            accept=".pdf,.docx,.txt,.jpg,.jpeg,.png"
                        />

                        {!file ? (
                            <div className="drop-content">
                                <div className="icon-circle">
                                    <UploadCloud size={32} />
                                </div>
                                <h3>Drag & Drop your file here</h3>
                                <p>or click to browse from your computer</p>
                                <span className="file-types">Supported: PDF, DOCX, TXT, Images</span>
                            </div>
                        ) : (
                            <div className="file-preview">
                                <File size={48} className="file-icon" />
                                <div className="file-info">
                                    <h4>{file.name}</h4>
                                    <p>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                </div>
                                <button
                                    type="button"
                                    className="btn-cancel"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setFile(null);
                                    }}
                                >
                                    Remove
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="actions">
                        <button
                            type="submit"
                            className={`btn btn-primary upload-btn ${status === 'uploading' ? 'loading' : ''}`}
                            disabled={status === 'uploading' || !file}
                        >
                            {status === 'uploading' ? 'Uploading...' : 'Upload Document'}
                        </button>
                    </div>

                    {status === 'success' && (
                        <div className="status-message success">
                            <CheckCircle size={20} />
                            <span>{message}</span>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="status-message error">
                            <AlertCircle size={20} />
                            <span>{message}</span>
                        </div>
                    )}

                </form>
            </div>
        </div>
    );
};

export default UploadPage;
