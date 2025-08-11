import Quill from "quill";
import QuillTableBetter from "quill-table-better";
import "quill/dist/quill.snow.css"
import "quill-table-better/dist/quill-table-better.css";
import {useCallback} from "react";
import {getLocalStorageSaverClass} from "shared/lib/quill/saveLoadContentModule.ts";

Quill.register({ "modules/table-better": QuillTableBetter }, true);

const LocalStorageSaverClass = getLocalStorageSaverClass();
Quill.register('modules/localStorageSaver', LocalStorageSaverClass, true);

const TOOLBAR_OPTIONS = [
    [{font: []}],
    [{size: ['small', false, 'large', 'huge']}],
    ["bold", "italic", "underline", "strike", { 'script': 'sub' }, { 'script': 'super' }],
    [{header: [1, 2, 3, 4, 5, false]}],
    [{color: []}, {background: []}],
    [{align: []}],
    [{list: "ordered"}, {list: "bullet"}],
    [{indent: '-1'}, {indent: '+1'}],
    ["blockquote", "code-block"],
    ["table-better"],
    ["link", "image"],
    ["clean"],
]

export default function EditorPage () {
    const wrapperRef = useCallback((wrapper:HTMLDivElement | null) => {
        if (wrapper == null) return

        wrapper.innerHTML = ""
        const editor = document.createElement('div')
        wrapper.append(editor)
        new Quill(editor,{theme: "snow", modules: {toolbar: TOOLBAR_OPTIONS, table: false,
                "table-better": {
                    language: "ru_RU",
                    menus: [
                        "column",
                        "row",
                        "merge",
                        "table",
                        "cell",
                        "wrap",
                        "copy",
                        "delete",
                    ],
                    toolbarTable: true,
                },
                "localStorageSaver": {
                    localStorageKey: 'QUILL_EDITOR_KEY',
                    debounceTime: 509
                },
                keyboard: {
                    bindings: QuillTableBetter.keyboardBindings,
                },}})

    }, [])
    return <div className="containerEditor" ref={wrapperRef}></div>

}