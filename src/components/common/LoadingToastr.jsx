import toastr from 'toastr';

/**
 * LoadingToastr - A utility class for showing and managing loading toastr notifications
 * 
 * Usage:
 * const loader = LoadingToastr.show('Processing...', 'blue');
 * // ... do async work ...
 * loader.hide();
 * 
 * Or with auto-cleanup:
 * const loader = LoadingToastr.show('Processing...', 'blue');
 * try {
 *   const result = await someAsyncOperation();
 *   loader.hide();
 *   toastr.success('Success!');
 * } catch (error) {
 *   loader.hide();
 *   toastr.error('Failed!');
 * }
 */
class LoadingToastr {
    constructor(toastrInstance) {
        this.toastrInstance = toastrInstance;
    }

    /**
     * Show a loading toastr with spinner
     * @param {string} message - The message to display
     * @param {string} color - The spinner color (default: '#3498db')
     * @param {Object} options - Additional toastr options
     * @returns {LoadingToastr} - LoadingToastr instance with hide() method
     */
    static show(message, color = '#3498db', options = {}) {
        // Ensure spinner CSS animation exists
        LoadingToastr.ensureSpinnerCSS();

        const defaultOptions = {
            timeOut: 0,
            extendedTimeOut: 0,
            closeButton: false,
            tapToDismiss: false,
            ...options
        };

        const toastrInstance = toastr.info(
            `<div style="display: flex; align-items: center; gap: 10px;">
                <div class="loading-spinner" style="width: 16px; height: 16px; border: 2px solid transparent; border-top: 2px solid ${color}; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                ${message}
            </div>`,
            '',
            defaultOptions
        );

        return new LoadingToastr(toastrInstance);
    }

    /**
     * Hide the loading toastr
     */
    hide() {
        if (this.toastrInstance) {
            toastr.clear(this.toastrInstance);
            this.toastrInstance = null;
        }
    }

    /**
     * Ensure the spinner CSS animation is available
     */
    static ensureSpinnerCSS() {
        if (!LoadingToastr.cssAdded) {
            const style = document.createElement('style');
            style.textContent = `
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                .loading-spinner {
                    flex-shrink: 0;
                }
            `;
            document.head.appendChild(style);
            LoadingToastr.cssAdded = true;
        }
    }

    /**
     * Predefined colors for common use cases
     */
    static colors = {
        blue: '#3498db',
        green: '#27ae60',
        orange: '#f39c12',
        red: '#e74c3c',
        purple: '#9b59b6',
        gray: '#95a5a6'
    };

    /**
     * Convenience methods for common loading scenarios
     */
    static showProcessing(message = 'Processing...') {
        return LoadingToastr.show(message, LoadingToastr.colors.blue);
    }

    static showGenerating(type = 'document') {
        return LoadingToastr.show(`Generating ${type}...`, LoadingToastr.colors.blue);
    }

    static showUploading(message = 'Uploading...') {
        return LoadingToastr.show(message, LoadingToastr.colors.green);
    }

    static showSaving(message = 'Saving...') {
        return LoadingToastr.show(message, LoadingToastr.colors.orange);
    }
}

// Static flag to track if CSS has been added
LoadingToastr.cssAdded = false;

export default LoadingToastr;
