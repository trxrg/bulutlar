// Curated list of local chat models the app can download.
//
// Every entry is pinned to an exact Hugging Face commit and carries the
// file's SHA-256 so a download is only accepted when it is byte-identical to
// what was reviewed here. All entries are Apache-2.0 licensed and ungated.
//
// The renderer can only ask for a download by `id`; it can never supply a URL.

const HF = 'https://huggingface.co';

function hfUrl(repo, commit, file) {
    return `${HF}/${repo}/resolve/${commit}/${file}`;
}

const GEMMA4_E4B = { repo: 'unsloth/gemma-4-E4B-it-GGUF', commit: 'bfc15c382204943c3a8fff0c750b94ae2364d7a3' };
const GEMMA4_12B = { repo: 'unsloth/gemma-4-12b-it-GGUF', commit: 'fc034cfff751157913579611efad8462ac1be606' };
const GEMMA4_26B = { repo: 'unsloth/gemma-4-26B-A4B-it-GGUF', commit: 'c099eb48e663fd284577b04978a94ffccb261841' };
const QWEN35_08B = { repo: 'unsloth/Qwen3.5-0.8B-GGUF', commit: '6ab461498e2023f6e3c1baea90a8f0fe38ab64d0' };
const QWEN35_4B = { repo: 'unsloth/Qwen3.5-4B-GGUF', commit: 'e87f176479d0855a907a41277aca2f8ee7a09523' };
const QWEN35_9B = { repo: 'unsloth/Qwen3.5-9B-GGUF', commit: '3885219b6810b007914f3a7950a8d1b469d598a5' };
const QWEN35_27B = { repo: 'unsloth/Qwen3.5-27B-GGUF', commit: '3221f178a6b842d04f1fb42f1c413534adcc0a6a' };

function entry(id, name, src, file, sizeBytes, sha256, minRamGB, tier, note) {
    return {
        id,
        name,
        file,
        url: hfUrl(src.repo, src.commit, file),
        sizeBytes,
        sha256,
        minRamGB,
        tier,
        note,
        license: 'Apache-2.0',
    };
}

export const MODEL_CATALOG = Object.freeze([
    entry('qwen3.5-0.8b-q4', 'Qwen 3.5 0.8B (Q4_K_M)', QWEN35_08B, 'Qwen3.5-0.8B-Q4_K_M.gguf',
        530_000_000, 'bd258782e35f7f458f8aced1adc053e6e92e89bc735ba3be89d38a06121dc517', 4, 'tiny',
        'very fast, low quality: for testing'),
    entry('qwen3.5-4b-q4', 'Qwen 3.5 4B (Q4_K_M)', QWEN35_4B, 'Qwen3.5-4B-Q4_K_M.gguf',
        2_740_000_000, '00fe7986ff5f6b463e62455821146049db6f9313603938a70800d1fb69ef11a4', 8, 'small', null),
    entry('gemma-4-e4b-q4', 'Gemma 4 E4B (Q4_K_M)', GEMMA4_E4B, 'gemma-4-E4B-it-Q4_K_M.gguf',
        4_980_000_000, '85a896a047553e842f25297ee5b031d64ff30147d9c4af17b1e4b394cd1fab87', 12, 'small', null),
    entry('qwen3.5-9b-q4', 'Qwen 3.5 9B (Q4_K_M)', QWEN35_9B, 'Qwen3.5-9B-Q4_K_M.gguf',
        5_680_000_000, '03b74727a860a56338e042c4420bb3f04b2fec5734175f4cb9fa853daf52b7e8', 16, 'medium', null),
    entry('gemma-4-12b-q4', 'Gemma 4 12B (Q4_K_M)', GEMMA4_12B, 'gemma-4-12b-it-Q4_K_M.gguf',
        7_120_000_000, '0a270ec9fe6b34f4a0d33992b6135117b484ebc4766ab76b51d4ae8c457e4c42', 16, 'medium', null),
    entry('gemma-4-26b-a4b-q3', 'Gemma 4 26B-A4B MoE (Q3_K_XL)', GEMMA4_26B, 'gemma-4-26B-A4B-it-UD-Q3_K_XL.gguf',
        12_910_000_000, '90a918830420e6a36e01c0d219e563f1d0ca7f223dffd90ad4e02ef4f3253fde', 24, 'large',
        'mixture-of-experts: large-model quality at small-model speed'),
    entry('qwen3.5-27b-q3', 'Qwen 3.5 27B (Q3_K_M)', QWEN35_27B, 'Qwen3.5-27B-Q3_K_M.gguf',
        13_510_000_000, 'f08ce37ebe8a7130db0c198262336773976b1e374f2444f898c41117710f0bb3', 24, 'large',
        'dense: slower than the MoE option'),
    entry('gemma-4-26b-a4b-q4', 'Gemma 4 26B-A4B MoE (Q4_K_M)', GEMMA4_26B, 'gemma-4-26B-A4B-it-UD-Q4_K_M.gguf',
        16_950_000_000, 'f2c28b3dc4776931ac6f879e11f203dec637ea0f14267a86ec8f6165f63f293f', 32, 'xl',
        'fits on 24 GB only with little else running'),
    entry('qwen3.5-27b-q4', 'Qwen 3.5 27B (Q4_K_M)', QWEN35_27B, 'Qwen3.5-27B-Q4_K_M.gguf',
        16_740_000_000, '84b5f7f112156d63836a01a69dc3f11a6ba63b10a23b8ca7a7efaf52d5a2d806', 32, 'xl',
        'fits on 24 GB only with little else running'),
]);

const RECOMMENDED_BY_RAM = [
    { minRamGB: 32, id: 'gemma-4-26b-a4b-q4' },
    { minRamGB: 24, id: 'gemma-4-26b-a4b-q3' },
    { minRamGB: 16, id: 'gemma-4-12b-q4' },
    { minRamGB: 12, id: 'gemma-4-e4b-q4' },
    { minRamGB: 0, id: 'qwen3.5-4b-q4' },
];

export function getCatalogEntry(id) {
    return MODEL_CATALOG.find((m) => m.id === id) || null;
}

export function recommendedModelId(totalRamBytes) {
    // os.totalmem() reports slightly less than the marketing size; round.
    const ramGB = Math.round(totalRamBytes / 1024 ** 3);
    return RECOMMENDED_BY_RAM.find((r) => ramGB >= r.minRamGB).id;
}
