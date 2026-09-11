import CodeMirror from '@uiw/react-codemirror';
import { html } from '@codemirror/lang-html';
import { EditorView } from '@codemirror/view';

// Dark theme tuned to match the admin panel's black/zinc/brand-yellow palette.
const darkTheme = EditorView.theme({
    '&': {
        backgroundColor: '#000000',
        color: '#e4e4e7',
        fontSize: '12px',
        borderRadius: '0.75rem',
        border: '1px solid #3f3f46'
    },
    '.cm-content': {
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word'
    },
    '.cm-scroller': { overflowX: 'hidden' },
    '.cm-gutters': {
        backgroundColor: '#09090b',
        color: '#71717a',
        border: 'none'
    },
    '&.cm-focused': { outline: 'none' },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': {
        backgroundColor: 'rgba(255, 178, 44, 0.25)'
    },
    '.cm-activeLine': { backgroundColor: 'rgba(255, 255, 255, 0.04)' },
    '.cm-activeLineGutter': { backgroundColor: 'rgba(255, 255, 255, 0.04)' }
}, { dark: true });

// Drop-in syntax-highlighted replacement for a plain <textarea> HTML editor.
// Keeps the same value/onChange(value) contract as a textarea's onChange(e.target.value).
export default function HtmlCodeEditor({ value, onChange, minHeight = '260px', placeholder }) {
    return (
        <div className="rounded-xl overflow-hidden border border-zinc-700 focus-within:border-brand-yellow transition-colors">
            <CodeMirror
                value={value || ''}
                onChange={(val) => onChange(val)}
                extensions={[html(), EditorView.lineWrapping]}
                theme={darkTheme}
                placeholder={placeholder}
                basicSetup={{
                    lineNumbers: true,
                    foldGutter: true,
                    highlightActiveLine: true,
                    autocompletion: true
                }}
                minHeight={minHeight}
            />
        </div>
    );
}
