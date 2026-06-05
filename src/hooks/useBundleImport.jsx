import { useCallback, useContext, useState } from 'react';
import toastr from 'toastr';
import { AppContext } from '../store/app-context';
import { DBContext } from '../store/db-context';
import LoadingToastr from '../components/common/LoadingToastr';
import ConfirmModal from '../components/common/ConfirmModal';
import GeneralModal from '../components/common/GeneralModal';
import ActionButton from '../components/common/ActionButton';

// Shared .blt import flow used by both entry points:
//   - the Settings "Import Bundle" button (no path → opens a file picker)
//   - OS click-to-open (main.js forwards the path via 'bundle-open-request')
// Both must show a confirmation before anything is applied, then run the same
// apply + refresh + toast logic. Keeping it in one hook guarantees the two
// flows can't drift apart.
//
// Returns:
//   requestImport(filePath?) — start the flow. With a path (click-to-open) it
//       confirms that file; without one (button) it opens the picker first.
//   importing                — true while an apply is in flight (disable button)
//   confirmModal             — render this somewhere in the component tree
function basename(p) {
    if (!p) return '';
    const parts = String(p).split(/[\\/]/);
    return parts[parts.length - 1] || String(p);
}

export default function useBundleImport() {
    const { translate: t, resetTabs } = useContext(AppContext);
    const { fetchAllData } = useContext(DBContext);

    const [pendingPath, setPendingPath] = useState(null);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [importing, setImporting] = useState(false);
    // The list of affected articles ({ title, effect }) shown after a successful
    // apply. null while the result modal is closed.
    const [resultEffects, setResultEffects] = useState(null);

    const requestImport = useCallback(async (filePath) => {
        let target = typeof filePath === 'string' && filePath.length > 0 ? filePath : null;
        if (!target) {
            try {
                target = await window.api.sharing.chooseBundleFile();
            } catch (err) {
                console.error('chooseBundleFile failed:', err);
                toastr.error(t('bundle import error') + (err?.message ? `: ${err.message}` : ''));
                return;
            }
            if (!target) return; // user cancelled the picker
        }
        setPendingPath(target);
        setConfirmOpen(true);
    }, [t]);

    const cancelImport = useCallback(() => {
        setConfirmOpen(false);
        setPendingPath(null);
    }, []);

    const confirmImport = useCallback(async () => {
        const target = pendingPath;
        setConfirmOpen(false);
        if (!target || importing) {
            setPendingPath(null);
            return;
        }
        setImporting(true);
        const loader = LoadingToastr.show(t('importing') + '...', LoadingToastr.colors.blue);
        try {
            const summary = await window.api.sharing.importBundle(target);
            if (!summary) return;
            await fetchAllData();
            resetTabs();
            if (summary.alreadyApplied) {
                toastr.info(t('bundle already imported'));
            } else {
                const effects = Array.isArray(summary.articleEffects) ? summary.articleEffects : [];
                // Show the affected-articles breakdown when there's something to
                // show; otherwise (e.g. only media/relations touched) just toast.
                if (effects.length > 0) {
                    setResultEffects(effects);
                } else {
                    toastr.success(t('bundle imported'));
                }
            }
        } catch (err) {
            console.error('Error importing bundle:', err);
            toastr.error(t('bundle import error') + (err?.message ? `: ${err.message}` : ''));
        } finally {
            loader.hide();
            setImporting(false);
            setPendingPath(null);
        }
    }, [pendingPath, importing, t, fetchAllData, resetTabs]);

    const confirmMessage = t('confirm import bundle') + (pendingPath ? `\n\n${basename(pendingPath)}` : '');

    const confirmModal = (
        <ConfirmModal
            isOpen={confirmOpen}
            message={confirmMessage}
            onClose={cancelImport}
            onConfirm={confirmImport}
        />
    );

    const closeResult = useCallback(() => setResultEffects(null), []);

    const EFFECT_STYLES = {
        new: 'bg-green-100 text-green-700',
        updated: 'bg-blue-100 text-blue-700',
        deleted: 'bg-red-100 text-red-700',
    };
    const EFFECT_LABELS = { new: t('effect new'), updated: t('effect updated'), deleted: t('effect deleted') };

    const resultModal = (
        <GeneralModal
            isOpen={resultEffects !== null}
            onRequestClose={closeResult}
            title={t('bundle imported')}
        >
            <div className="flex flex-col min-h-0">
                <div className="overflow-y-auto max-h-[50vh] divide-y divide-gray-100 pr-1">
                    {(resultEffects || []).map((e, i) => (
                        <div key={i} className="flex items-center justify-between gap-4 py-2">
                            <span className="text-gray-700 break-words">{e.title}</span>
                            <span className={'shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold ' + (EFFECT_STYLES[e.effect] || 'bg-gray-100 text-gray-700')}>
                                {EFFECT_LABELS[e.effect] || e.effect}
                            </span>
                        </div>
                    ))}
                </div>
                <div className="flex justify-end mt-4">
                    <ActionButton onClick={closeResult}>{t('close')}</ActionButton>
                </div>
            </div>
        </GeneralModal>
    );

    return { requestImport, importing, confirmModal, resultModal };
}
