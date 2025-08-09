import Quill from "quill";

import debounce from "shared/lib/debounce/debounce.ts";

interface LocalStorageSaverOptions {
    localStorageKey?: string;
    debounceTime?: number;
}
// Надеюсь больше никто не попадёт в болото этого ужаса, но я знаю что это придётся переписывать
export function getLocalStorageSaverClass() {
    const Module: any = Quill.import("core/module");

    class LocalStorageSaver extends Module {
        quill: Quill;
        options: LocalStorageSaverOptions;
        localStorageKey: string;
        saveContentDebounced: () => void;

        saveContent = () => {
            const delta = this.quill.getContents();
            if (delta.ops.length > 1 || (delta.ops.length === 1 && delta.ops[0].insert !== "\n")) {
                localStorage.setItem(this.localStorageKey, JSON.stringify(delta));
            } else {
                localStorage.removeItem(this.localStorageKey);
            }
        };

        loadContent = () => {
            const savedContent = localStorage.getItem(this.localStorageKey);
            if (savedContent) {
                try {
                    const delta = JSON.parse(savedContent);
                    this.quill.setContents(delta);
                } catch (e) {
                    localStorage.removeItem(this.localStorageKey);
                }
            }
        };

        constructor(quill: Quill, options: LocalStorageSaverOptions) {
            super(quill, options);
            this.quill = quill;
            this.options = options;
            this.localStorageKey = options.localStorageKey || "QUILL-ADMIN-DUMMY";

            this.saveContentDebounced = debounce(this.saveContent, options.debounceTime || 500);

            this.loadContent();
            this.quill.on("text-change", this.saveContentDebounced);
            window.addEventListener("beforeunload", this.saveContent);
        }

        destroy() {
            this.quill.off("text-change", this.saveContentDebounced);
            window.removeEventListener("beforeunload", this.saveContent);
            super.destroy();
        }
    }

    return LocalStorageSaver;
}