import { useContext } from 'react';
import { AppContext } from '../../store/app-context';
import { useYoutubeDownload } from '../../store/youtube-download-context.jsx';

const truncate = (text, max = 30) => {
    if (!text) return '';
    return text.length > max ? `${text.slice(0, max)}…` : text;
};

const YoutubeDownloadChip = ({ job, onClick }) => {
    const { translate: t } = useContext(AppContext);
    const isDownloading = job.status === 'downloading' || job.status === 'cancelling';
    const isCompleted = job.status === 'completed';
    const isError = job.status === 'error';
    const progress = Math.min(job.progress ?? 0, 100);

    const title = isCompleted
        ? t('youtube download open article', { title: job.title })
        : (job.title || t('youtube download in progress'));

    return (
        <button
            type="button"
            className="footer-yt-download-chip flex items-center gap-1.5 max-w-[220px] min-w-0 rounded px-1.5 py-0.5 hover:opacity-80"
            style={{
                backgroundColor: 'var(--bg-secondary, rgba(0,0,0,0.08))',
                border: '1px solid var(--border-primary)',
            }}
            onClick={() => onClick(job.id)}
            title={title}
        >
            <span className="truncate text-[10px] leading-none min-w-0">
                {truncate(job.title)}
            </span>
            {isDownloading && (
                <span className="flex items-center gap-1 shrink-0">
                    <span
                        className="inline-block w-12 h-1 rounded-full overflow-hidden"
                        style={{ backgroundColor: 'var(--border-primary)' }}
                    >
                        <span
                            className="block h-full rounded-full"
                            style={{
                                width: `${progress}%`,
                                backgroundColor: 'var(--accent-green, #22c55e)',
                            }}
                        />
                    </span>
                    <span className="text-[10px] tabular-nums">{Math.round(progress)}%</span>
                </span>
            )}
            {isCompleted && (
                <span className="text-[10px] text-green-600 shrink-0" title={t('youtube download finished')}>
                    ✓
                </span>
            )}
            {isError && (
                <span className="text-[10px] text-red-600 shrink-0">!</span>
            )}
        </button>
    );
};

const FooterYoutubeDownloads = ({ overlay = false }) => {
    const { visibleJobs, handleFooterChipClick } = useYoutubeDownload();

    if (!visibleJobs.length) return null;

    const wrapperClass = overlay
        ? 'fixed bottom-0 left-0 right-0 z-50 flex justify-end items-center gap-1.5 px-2 py-1 pointer-events-none'
        : 'flex items-center gap-1.5 min-w-0';

    return (
        <div className={wrapperClass} style={overlay ? { height: '22px' } : undefined}>
            {visibleJobs.map((job) => (
                <div key={job.id} className={overlay ? 'pointer-events-auto' : undefined}>
                    <YoutubeDownloadChip job={job} onClick={handleFooterChipClick} />
                </div>
            ))}
        </div>
    );
};

export default FooterYoutubeDownloads;
