import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useToolState } from '../contexts/ToolStateContext';
import { useToasts } from '../contexts/ToastContext';
import { ToolHeader } from '../components/ui/ToolHeader';
import { CopyIcon } from '../components/icons/Icons';

// --- MD5 Implementation (based on Paul Johnston's work, http://pajhome.org.uk/crypt/md5) ---
// This is a self-contained implementation to avoid external dependencies.
const md5 = (str: string): string => {
    const hex_chr = "0123456789abcdef";
    function rhex(num: number) {
        let str = "";
        for (let j = 0; j <= 3; j++)
            str += hex_chr.charAt((num >> (j * 8 + 4)) & 0x0F) +
                   hex_chr.charAt((num >> (j * 8)) & 0x0F);
        return str;
    }

    function str2blks_MD5(str: string): number[] {
        // A robust way to convert the string to UTF-8 bytes
        const utftext = unescape(encodeURIComponent(str));
        const nblk = ((utftext.length + 8) >> 6) + 1; // Number of 16-word blocks
        const blks: number[] = new Array(nblk * 16);

        for (let i = 0; i < nblk * 16; i++) {
            blks[i] = 0;
        }

        for (let i = 0; i < utftext.length; i++) {
            blks[i >> 2] |= utftext.charCodeAt(i) << ((i % 4) * 8);
        }

        blks[utftext.length >> 2] |= 0x80 << ((utftext.length % 4) * 8);

        const bitLength = utftext.length * 8;
        blks[nblk * 16 - 2] = bitLength & 0xFFFFFFFF;
        blks[nblk * 16 - 1] = Math.floor(bitLength / 0x100000000);

        return blks;
    }

    function add(x: number, y: number) {
        const lsw = (x & 0xFFFF) + (y & 0xFFFF);
        const msw = (x >> 16) + (y >> 16) + (lsw >> 16);
        return (msw << 16) | (lsw & 0xFFFF);
    }

    function rol(num: number, cnt: number) {
        return (num << cnt) | (num >>> (32 - cnt));
    }

    function cmn(q: number, a: number, b: number, x: number, s: number, t: number) {
        return add(rol(add(add(a, q), add(x, t)), s), b);
    }
    function ff(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
        return cmn((b & c) | ((~b) & d), a, b, x, s, t);
    }
    function gg(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
        return cmn((b & d) | (c & (~d)), a, b, x, s, t);
    }
    function hh(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
        return cmn(b ^ c ^ d, a, b, x, s, t);
    }
    function ii(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
        return cmn(c ^ (b | (~d)), a, b, x, s, t);
    }

    const x = str2blks_MD5(str);
    let a = 1732584193;
    let b = -271733879;
    let c = -1732584194;
    let d = 271733878;

    for (let i = 0; i < x.length; i += 16) {
        const AA = a, BB = b, CC = c, DD = d;
        a = ff(a, b, c, d, x[i + 0], 7, -680876936);
        d = ff(d, a, b, c, x[i + 1], 12, -389564586);
        c = ff(c, d, a, b, x[i + 2], 17, 606105819);
        b = ff(b, c, d, a, x[i + 3], 22, -1044525330);
        a = ff(a, b, c, d, x[i + 4], 7, -176418897);
        d = ff(d, a, b, c, x[i + 5], 12, 1200080426);
        c = ff(c, d, a, b, x[i + 6], 17, -1473231341);
        b = ff(b, c, d, a, x[i + 7], 22, -45705983);
        a = ff(a, b, c, d, x[i + 8], 7, 1770035416);
        d = ff(d, a, b, c, x[i + 9], 12, -1958414417);
        c = ff(c, d, a, b, x[i + 10], 17, -42063);
        b = ff(b, c, d, a, x[i + 11], 22, -1990404162);
        a = ff(a, b, c, d, x[i + 12], 7, 1804603682);
        d = ff(d, a, b, c, x[i + 13], 12, -40341101);
        c = ff(c, d, a, b, x[i + 14], 17, -1502002290);
        b = ff(b, c, d, a, x[i + 15], 22, 1236535329);
        a = gg(a, b, c, d, x[i + 1], 5, -165796510);
        d = gg(d, a, b, c, x[i + 6], 9, -1069501632);
        c = gg(c, d, a, b, x[i + 11], 14, 643717713);
        b = gg(b, c, d, a, x[i + 0], 20, -373897302);
        a = gg(a, b, c, d, x[i + 5], 5, -701558691);
        d = gg(d, a, b, c, x[i + 10], 9, 38016083);
        c = gg(c, d, a, b, x[i + 15], 14, -660478335);
        b = gg(b, c, d, a, x[i + 4], 20, -405537848);
        a = gg(a, b, c, d, x[i + 9], 5, 568446438);
        d = gg(d, a, b, c, x[i + 14], 9, -1019803690);
        c = gg(c, d, a, b, x[i + 3], 14, -187363961);
        b = gg(b, c, d, a, x[i + 8], 20, 1163531501);
        a = gg(a, b, c, d, x[i + 13], 5, -1444681467);
        d = gg(d, a, b, c, x[i + 2], 9, -51403784);
        c = gg(c, d, a, b, x[i + 7], 14, 1735328473);
        b = gg(b, c, d, a, x[i + 12], 20, -1926607734);
        a = hh(a, b, c, d, x[i + 5], 4, -378558);
        d = hh(d, a, b, c, x[i + 8], 11, -2022574463);
        c = hh(c, d, a, b, x[i + 11], 16, 1839030562);
        b = hh(b, c, d, a, x[i + 14], 23, -35309556);
        a = hh(a, b, c, d, x[i + 1], 4, -1530992060);
        d = hh(d, a, b, c, x[i + 4], 11, 1272893353);
        c = hh(c, d, a, b, x[i + 7], 16, -155497632);
        b = hh(b, c, d, a, x[i + 10], 23, -1094730640);
        a = hh(a, b, c, d, x[i + 13], 4, 681279174);
        d = hh(d, a, b, c, x[i + 0], 11, -358537222);
        c = hh(c, d, a, b, x[i + 3], 16, -722521979);
        b = hh(b, c, d, a, x[i + 6], 23, 76029189);
        a = hh(a, b, c, d, x[i + 9], 4, -640364487);
        d = hh(d, a, b, c, x[i + 12], 11, -421815835);
        c = hh(c, d, a, b, x[i + 15], 16, 530742520);
        b = hh(b, c, d, a, x[i + 2], 23, -995338651);
        a = ii(a, b, c, d, x[i + 0], 6, -198630844);
        d = ii(d, a, b, c, x[i + 7], 10, 1126891415);
        c = ii(c, d, a, b, x[i + 14], 15, -1416354905);
        b = ii(b, c, d, a, x[i + 5], 21, -57434055);
        a = ii(a, b, c, d, x[i + 12], 6, 1700485571);
        d = ii(d, a, b, c, x[i + 3], 10, -1894986606);
        c = ii(c, d, a, b, x[i + 10], 15, -1051523);
        b = ii(b, c, d, a, x[i + 1], 21, -2054922799);
        a = ii(a, b, c, d, x[i + 8], 6, 1873313359);
        d = ii(d, a, b, c, x[i + 15], 10, -30611744);
        c = ii(c, d, a, b, x[i + 6], 15, -1560198380);
        b = ii(b, c, d, a, x[i + 13], 21, 1309151649);
        a = ii(a, b, c, d, x[i + 4], 6, -145523070);
        d = ii(d, a, b, c, x[i + 11], 10, -1120210379);
        c = ii(c, d, a, b, x[i + 2], 15, 718787259);
        b = ii(b, c, d, a, x[i + 9], 21, -343485551);
        a = add(a, AA); b = add(b, BB); c = add(c, CC); d = add(d, DD);
    }
    return rhex(a) + rhex(b) + rhex(c) + rhex(d);
};


interface Md5HasherState {
    input: string;
    isUppercase: boolean;
}

const Md5Hasher: React.FC = () => {
    const { t } = useTranslation();
    const addToast = useToasts();
    const { state, setState } = useToolState<Md5HasherState>('md5-hasher', {
        input: 'Hello World!',
        isUppercase: false,
    });
    const { input, isUppercase } = state;

    const md5Hash = useMemo(() => {
        if (!input) return '';
        return md5(input);
    }, [input]);
    
    const displayHash = isUppercase ? md5Hash.toUpperCase() : md5Hash.toLowerCase();

    const handleCopy = () => {
        if (!displayHash) return;
        navigator.clipboard.writeText(displayHash).then(() => {
            addToast(t('common.toast.copiedSuccess'), 'success');
        }, () => {
            addToast(t('common.toast.copiedFailed'), 'error');
        });
    };

    return (
        <div>
            <ToolHeader
              title={t('tools.md5Hasher.pageTitle')}
              description={t('tools.md5Hasher.pageDescription')}
            />
            
            <div className="flex flex-col gap-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 flex flex-col">
                        <label htmlFor="hash-input" className="font-semibold mb-2 text-text-secondary dark:text-d-text-secondary">{t('tools.md5Hasher.inputLabel')}</label>
                        <textarea
                            id="hash-input"
                            value={input}
                            onChange={(e) => setState(s => ({ ...s, input: e.target.value }))}
                            placeholder={t('tools.md5Hasher.placeholder') as string}
                            className="w-full flex-grow p-4 bg-secondary dark:bg-d-secondary border border-border-color dark:border-d-border-color rounded-xl text-text-primary dark:text-d-text-primary focus:outline-none focus:ring-2 focus:ring-accent dark:focus:ring-d-accent font-mono text-base resize-y shadow-sm"
                            style={{ minHeight: '150px' }}
                        />
                    </div>
                    <div className="lg:col-span-1 flex flex-col">
                        <label className="font-semibold mb-2 text-text-secondary dark:text-d-text-secondary">{t('tools.uuidGenerator.options')}</label>
                        <div className="w-full p-4 bg-secondary dark:bg-d-secondary border border-border-color dark:border-d-border-color rounded-xl">
                            <div className="flex items-center justify-between">
                                <label htmlFor="uppercase-toggle" className="font-medium text-text-primary dark:text-d-text-primary">{t('tools.md5Hasher.uppercase')}</label>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" id="uppercase-toggle" className="sr-only peer" checked={isUppercase} onChange={() => setState(s => ({ ...s, isUppercase: !s.isUppercase }))} />
                                    <div className="w-11 h-6 bg-border-color peer-focus:outline-none rounded-full peer dark:bg-d-border-color peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                <div>
                    <h3 className="text-xl font-bold text-text-primary dark:text-d-text-primary mb-2">{t('tools.md5Hasher.outputLabel')}</h3>
                    <div className="relative p-4 bg-secondary dark:bg-d-secondary border border-border-color dark:border-d-border-color rounded-lg font-mono text-lg text-accent dark:text-d-accent">
                        {displayHash}
                        <button
                            onClick={handleCopy}
                            className="absolute top-1/2 right-3 -translate-y-1/2 p-2 bg-primary dark:bg-d-primary text-text-secondary dark:text-d-text-secondary rounded-md hover:bg-border-color dark:hover:bg-d-border-color transition-colors"
                            aria-label={t('common.copy')}
                        >
                            <CopyIcon />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Md5Hasher;
