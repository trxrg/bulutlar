import toastr from 'toastr';

/**
 * Success toastr after export with an optional "show in folder" action.
 */
export function showExportSuccessToastr(message, filePath, showInFolderLabel) {
    if (!filePath) {
        toastr.success(message);
        return;
    }

    const buttonId = `export-show-folder-${Date.now()}`;
    const html = `
        <div class="export-success-toast">
            <span>${message}</span>
            <button type="button" id="${buttonId}" class="export-success-toast__btn">
                ${showInFolderLabel}
            </button>
        </div>
    `;

    toastr.success(html, '', {
        escapeHtml: false,
        timeOut: 12000,
        extendedTimeOut: 4000,
        tapToDismiss: true,
    });

    requestAnimationFrame(() => {
        const button = document.getElementById(buttonId);
        if (!button) return;
        button.addEventListener('click', async (event) => {
            event.preventDefault();
            event.stopPropagation();
            try {
                await window.api.shell.showInFolder(filePath);
            } catch (err) {
                console.warn('showInFolder failed:', err);
            }
        });
    });
}
