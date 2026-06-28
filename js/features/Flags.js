// CSS-drawn approximations of the 1850-era flags of each great power.
// Each value is a CSS `background` string applied to a small flag swatch.

export const FLAGS = {
    usa: `
        linear-gradient(#3c3b6e,#3c3b6e) no-repeat top left / 42% 54%,
        repeating-linear-gradient(180deg,#b22234 0 7.69%,#ffffff 7.69% 15.38%)`,
    britain: `
        linear-gradient(#c8102e,#c8102e) no-repeat center / 100% 18%,
        linear-gradient(#c8102e,#c8102e) no-repeat center / 18% 100%,
        linear-gradient(#ffffff,#ffffff) no-repeat center / 100% 34%,
        linear-gradient(#ffffff,#ffffff) no-repeat center / 34% 100%,
        #012169`,
    russia: `linear-gradient(180deg,#ffffff 0 33.3%,#0039a6 33.3% 66.6%,#d52b1e 66.6% 100%)`,
    qing: `
        radial-gradient(circle at 50% 50%, #1b4d8e 12%, transparent 13%),
        linear-gradient(135deg,#1b4d8e 0 16%, transparent 16%),
        #ffce00`,
    ottoman: `
        radial-gradient(circle at 56% 50%, #e30a17 13%, transparent 14%),
        radial-gradient(circle at 47% 50%, #ffffff 16%, transparent 17%),
        #e30a17`,
    france: `linear-gradient(90deg,#0055a4 0 33.3%,#ffffff 33.3% 66.6%,#ef4135 66.6% 100%)`,
    austria: `linear-gradient(180deg,#ed2939 0 33.3%,#ffffff 33.3% 66.6%,#ed2939 66.6% 100%)`,
    prussia: `linear-gradient(180deg,#111111 0 50%,#ffffff 50% 100%)`
};

export function getFlag(nationKey) {
    return FLAGS[nationKey] || '#777';
}
