/**
 * Shared utilities for code editors
 */

// Auto-detect language from code
export const detectLanguage = (code) => {
    if (!code || code.trim().length < 10) return null;

    // Python patterns
    const pythonPatterns = [
        /\bdef\s+\w+\s*\(/,          // def function_name(
        /\bimport\s+\w+/,            // import module
        /\bfrom\s+\w+\s+import/,     // from x import
        /\bprint\s*\(/,              // print(
        /:\s*$/m,                    // colon at end of line
        /\bself\./,                  // self.
        /\belif\b/,                  // elif
        /\b__\w+__\b/,               // __name__, __init__
    ];

    // Java patterns
    const javaPatterns = [
        /\bpublic\s+(static\s+)?class\b/,   // public class
        /\bpublic\s+static\s+void\s+main\b/, // main method
        /\bSystem\.out\.print/,              // System.out.print
        /\bprivate\s+\w+\s+\w+\s*;/,         // private int x;
        /\bnew\s+\w+\s*\(/,                  // new Object(
        /\bextends\s+\w+/,                   // extends Class
        /\bimplements\s+\w+/,                // implements Interface
    ];

    // C++ patterns
    const cppPatterns = [
        /\#include\s*<\w+>/,              // #include <iostream>
        /\bstd::/,                        // std::
        /\bcout\s*<</,                    // cout <<
        /\bcin\s*>>/,                     // cin >>
        /\bint\s+main\s*\(/,              // int main(
        /\busing\s+namespace\s+std/,      // using namespace std
        /\bvector\s*</,                   // vector<
        /\b->\b/,                         // pointer arrow
    ];

    // JavaScript patterns
    const jsPatterns = [
        /\bconst\s+\w+\s*=/,           // const x =
        /\blet\s+\w+\s*=/,             // let x =
        /\bvar\s+\w+\s*=/,             // var x =
        /\bfunction\s+\w+\s*\(/,       // function name(
        /=>\s*{/,                      // arrow function
        /\bconsole\.(log|warn|error)\s*\(/, // console.log
        /\bdocument\./,                // document.
        /\bwindow\./,                  // window.
        /\basync\s+function/,          // async function
        /\bawait\s+/,                  // await
        /\brequire\s*\(/,              // require(
        /\bexport\s+(default\s+)?/,    // export
    ];

    // Count matches for each language
    let pythonScore = 0, javaScore = 0, cppScore = 0, jsScore = 0;

    pythonPatterns.forEach(p => { if (p.test(code)) pythonScore++; });
    javaPatterns.forEach(p => { if (p.test(code)) javaScore++; });
    cppPatterns.forEach(p => { if (p.test(code)) cppScore++; });
    jsPatterns.forEach(p => { if (p.test(code)) jsScore++; });

    // Find the highest score
    const scores = { Python: pythonScore, Java: javaScore, "C++": cppScore, JavaScript: jsScore };
    const maxScore = Math.max(...Object.values(scores));

    if (maxScore === 0) return null;

    for (const [lang, score] of Object.entries(scores)) {
        if (score === maxScore) return lang;
    }

    return null;
};

// Check if selected language matches the code
export const checkLanguageMismatch = (code, selectedLanguage) => {
    if (!code || code.trim().length < 20) return { mismatch: false };

    const detectedLang = detectLanguage(code);

    if (detectedLang && detectedLang !== selectedLanguage) {
        return {
            mismatch: true,
            detected: detectedLang,
            selected: selectedLanguage,
            message: `It looks like you're writing ${detectedLang} code, but ${selectedLanguage} is selected. Please select the correct language.`
        };
    }

    return { mismatch: false };
};

// Copy to clipboard with feedback
export const copyToClipboard = async (text, setToast) => {
    if (!text) return false;

    try {
        await navigator.clipboard.writeText(text);
        if (setToast) {
            setToast("Copied!");
            setTimeout(() => setToast(""), 2000);
        }
        return true;
    } catch (err) {
        console.error("Failed to copy:", err);
        if (setToast) {
            setToast("Failed to copy");
            setTimeout(() => setToast(""), 2000);
        }
        return false;
    }
};

// Show toast notification
export const showCopiedToast = () => {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = 'copy-toast';
    toast.textContent = '✓ Copied!';
    document.body.appendChild(toast);

    // Animate in
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);

    // Remove after 2 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 2000);
};

// Copy with toast (simpler version)
export const copyWithToast = async (text) => {
    if (!text) return false;

    try {
        await navigator.clipboard.writeText(text);
        showCopiedToast();
        return true;
    } catch (err) {
        console.error("Failed to copy:", err);
        return false;
    }
};
