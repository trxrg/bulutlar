import React, { Component } from 'react';
import { withTranslation } from 'react-i18next';
import { resetAllResettableStates, clearAllStates } from './utils/stateReset';

class ErrorBoundary extends Component {
    
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, isResetting: false };
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
            this.setState({ hasError: false, error: null, isResetting: false });
        }
    }

    handleReloadWithReset = async () => {
        this.setState({ isResetting: true });
        try {
            // Reset the resettable states before reloading
            await resetAllResettableStates();
            window.location.reload();
        } catch (error) {
            console.error('Error during state reset:', error);
            // Reload anyway even if reset fails
            window.location.reload();
        }
    };

    handleClearAllAndReload = async () => {
        this.setState({ isResetting: true });
        const confirmed = window.confirm(
            'This will clear ALL application settings and preferences. Are you sure?'
        );
        if (confirmed) {
            try {
                await clearAllStates();
                window.location.reload();
            } catch (error) {
                console.error('Error during full state clear:', error);
                window.location.reload();
            }
        } else {
            this.setState({ isResetting: false });
        }
    };

    render() {
        const { t, fallback } = this.props;
        const { isResetting } = this.state;
        
        if (this.state.hasError) {
            // Use custom fallback if provided
            if (fallback) {
                return fallback;
            }
            
            // Default fallback UI
            return (
                <div className="text-center mt-10 p-6">
                    <h1 className="text-2xl font-bold mb-4">{t("something went wrong")}</h1>
                    <p className="text-gray-600 mb-6 max-w-md mx-auto">
                        {t("error may be caused by corrupted state")}
                    </p>
                    <div className="flex flex-col gap-3 items-center">
                        <button 
                            onClick={() => window.location.reload()} 
                            disabled={isResetting}
                            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed min-w-[200px]"
                        >
                            {t("reload page")}
                        </button>
                        <button 
                            onClick={this.handleReloadWithReset}
                            disabled={isResetting}
                            className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed min-w-[200px]"
                        >
                            {isResetting ? t("resetting...") : t("reset search related state and reload")}
                        </button>
                        <button 
                            onClick={this.handleClearAllAndReload}
                            disabled={isResetting}
                            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed min-w-[200px]"
                        >
                            {t("clear all settings and reload")}
                        </button>
                    </div>
                    {this.state.error && (
                        <details className="mt-6 text-left max-w-2xl mx-auto">
                            <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                                {t("show error details")}
                            </summary>
                            <pre className="mt-2 p-4 bg-gray-100 rounded text-sm overflow-auto">
                                {this.state.error.toString()}
                            </pre>
                        </details>
                    )}
                </div>
            );
        }

        return this.props.children; 
    }
}

export default withTranslation()(ErrorBoundary);