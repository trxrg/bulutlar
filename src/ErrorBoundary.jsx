import React, { Component } from 'react';
import { withTranslation } from 'react-i18next';

class ErrorBoundary extends Component {
    
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // You can also log the error to an error reporting service
        console.error("ErrorBoundary caught an error", error, errorInfo);
    }

    componentDidUpdate(prevProps) {
        // Reset error state when children change (e.g., switching tabs)
        if (this.props.children !== prevProps.children && this.state.hasError) {
            this.setState({ hasError: false, error: null });
        }
    }

    render() {
        const { t, fallback } = this.props;
        
        if (this.state.hasError) {
            // Use custom fallback if provided
            if (fallback) {
                return fallback;
            }
            
            // Default fallback UI
            return (
                <div className="text-center mt-10">
                    <h1>{t("something went wrong")}</h1>
                    <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded">
                        {t("reload page")}
                    </button>
                </div>
            );
        }

        return this.props.children; 
    }
}

export default withTranslation()(ErrorBoundary);