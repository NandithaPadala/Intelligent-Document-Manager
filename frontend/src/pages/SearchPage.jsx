import { useState } from 'react';
import { Search, Loader2, FileText, ChevronRight } from 'lucide-react';
import axios from 'axios';
import './SearchPage.css';

const SearchPage = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [error, setError] = useState('');
    const [docType, setDocType] = useState('All Types');
    const [minScore, setMinScore] = useState(0);
    const [showFilters, setShowFilters] = useState(false);

    const DOC_CATEGORIES = [
        "All Types",
        "student ID card",
        "PAN card",
        "Aadhaar card",
        "passport document",
        "marks sheet",
        "fee receipt",
        "invoices",
        "medical bills",
        "resumes",
        "certificates",
        "other document"
    ];

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!query.trim()) return;

        setIsSearching(true);
        setError('');
        setHasSearched(true);

        try {
            const response = await axios.post('http://127.0.0.1:8000/search', {
                query: query,
                doc_type: docType,
                min_score: minScore / 100 // Convert percentage to float
            });

            setResults(response.data.results || []);
        } catch (err) {
            console.error('Search Error:', err);
            setError('Failed to fetch search results. Please try again later.');
            setResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <div className="search-page animate-fade-in">
            <div className="search-header">
                <h1 className="page-title">Semantic Document Search</h1>
                <p className="subtitle">Find exactly what you're looking for across all your documents.</p>
            </div>

            <div className="search-container">
                <form onSubmit={handleSearch} className="search-form">
                    <div className="search-input-wrapper glass-panel">
                        <Search className="search-icon" size={24} />
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Search for 'invoice from Apple' or '10th certificate'..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            autoFocus
                        />
                        <button
                            type="button"
                            className={`btn btn-secondary filter-toggle-btn ${showFilters ? 'active' : ''}`}
                            onClick={() => setShowFilters(!showFilters)}
                            title="Advanced Filters"
                        >
                            Filters {showFilters ? '▲' : '▼'}
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary search-btn"
                            disabled={isSearching || !query.trim()}
                        >
                            {isSearching ? <Loader2 className="animate-spin" size={20} /> : 'Search'}
                        </button>
                    </div>

                    {showFilters && (
                        <div className="advanced-filters glass-panel animate-fade-in">
                            <h3 className="filters-title">Advanced Filters</h3>
                            <div className="filters-grid">
                                <div className="filter-group">
                                    <label htmlFor="docTypeFilter">Document Type</label>
                                    <select
                                        id="docTypeFilter"
                                        className="filter-select"
                                        value={docType}
                                        onChange={(e) => setDocType(e.target.value)}
                                    >
                                        {DOC_CATEGORIES.map(category => (
                                            <option key={category} value={category}>
                                                {category === "All Types" ? category : category.charAt(0).toUpperCase() + category.slice(1)}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="filter-group">
                                    <label htmlFor="minScoreFilter">
                                        Minimum Match Score: {minScore}%
                                    </label>
                                    <input
                                        type="range"
                                        id="minScoreFilter"
                                        className="filter-slider"
                                        min="0"
                                        max="100"
                                        step="5"
                                        value={minScore}
                                        onChange={(e) => setMinScore(Number(e.target.value))}
                                    />
                                    <div className="slider-labels">
                                        <span>Broad</span>
                                        <span>Specific</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </form>

                {error && (
                    <div className="search-error glass-panel">
                        <p>{error}</p>
                    </div>
                )}

                <div className="results-container">
                    {isSearching && (
                        <div className="loading-state">
                            <Loader2 className="animate-spin" size={40} />
                            <p>Searching your documents...</p>
                        </div>
                    )}

                    {!isSearching && hasSearched && results.length === 0 && !error && (
                        <div className="empty-state glass-panel">
                            <div className="empty-icon-wrapper">
                                <Search size={48} />
                            </div>
                            <h3>No results found</h3>
                            <p>We couldn't find any documents matching your query. Try different keywords.</p>
                        </div>
                    )}

                    {!isSearching && results.length > 0 && (
                        <div className="results-list animate-fade-in">
                            <h3 className="results-count">Showing {results.length} results for "{query}"</h3>

                            {results.map((result, index) => (
                                <div key={index} className="result-card glass-panel">
                                    <div className="result-header">
                                        <div className="result-type">
                                            <FileText size={18} />
                                            <span>{result.metadata?.doc_type || 'Document'}</span>
                                        </div>
                                        <span className="result-score">Match: {Math.round(result.score * 100)}%</span>
                                    </div>

                                    <h4 className="result-filename">{result.metadata?.filename}</h4>

                                    <div className="result-snippet">
                                        <p>...{result.metadata?.text_chunk}...</p>
                                    </div>

                                    <div className="result-footer">
                                        <button
                                            className="btn-view-doc"
                                            onClick={() => {
                                                const url = result.metadata?.url;
                                                if (url) window.open(url, '_blank');
                                                else window.open(`http://localhost:8000/documents/${result.metadata?.filename}`, '_blank');
                                            }}
                                        >
                                            <span>View Document</span>
                                            <ChevronRight size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SearchPage;
