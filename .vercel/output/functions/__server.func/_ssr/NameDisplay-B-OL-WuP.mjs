import { j as jsxRuntimeExports } from "../_chunks/_libs/react.mjs";
import { u as useStore } from "../_chunks/_libs/@tanstack/react-store.mjs";
import { u as uiStore } from "./router-De5441r5.mjs";
const VIRAMA = "్";
const CONSONANTS = [
  // Multi-char clusters
  ["ksh", "క్ష"],
  ["chh", "ఛ"],
  // Nasal + consonant clusters
  ["nch", "ంచ"],
  ["nk", "ంక"],
  ["ng", "ంగ"],
  ["nj", "ంజ"],
  ["nt", "ంత"],
  ["nd", "ంద"],
  ["mp", "ంప"],
  ["mb", "ంబ"],
  // Double consonants (retroflex for dd/tt, others geminate)
  ["dd", `డ${VIRAMA}డ`],
  ["tt", `ట${VIRAMA}ట`],
  ["kk", `క${VIRAMA}క`],
  ["gg", `గ${VIRAMA}గ`],
  ["jj", `జ${VIRAMA}జ`],
  ["nn", `న${VIRAMA}న`],
  ["pp", `ప${VIRAMA}ప`],
  ["bb", `బ${VIRAMA}బ`],
  ["mm", `మ${VIRAMA}మ`],
  ["ll", `ల${VIRAMA}ల`],
  ["ss", `స${VIRAMA}స`],
  ["rr", `ర${VIRAMA}ర`],
  // Aspirated consonants
  ["kh", "ఖ"],
  ["gh", "ఘ"],
  ["ch", "చ"],
  ["jh", "ఝ"],
  ["th", "త"],
  ["dh", "ధ"],
  ["ph", "ఫ"],
  ["bh", "భ"],
  ["sh", "శ"],
  // Single consonants
  ["k", "క"],
  ["g", "గ"],
  ["c", "క"],
  ["j", "జ"],
  ["t", "త"],
  ["d", "ద"],
  ["n", "న"],
  ["p", "ప"],
  ["b", "బ"],
  ["m", "మ"],
  ["y", "య"],
  ["r", "ర"],
  ["l", "ల"],
  ["v", "వ"],
  ["w", "వ"],
  ["s", "స"],
  ["h", "హ"],
  ["f", "ఫ"],
  ["z", "జ"],
  ["q", "క"],
  ["x", `క${VIRAMA}స`]
];
const VOWELS_STANDALONE = [
  ["aa", "ఆ"],
  ["ai", "ఐ"],
  ["au", "ఔ"],
  ["ee", "ఈ"],
  ["oo", "ఊ"],
  ["ou", "ఔ"],
  ["ow", "ఔ"],
  ["a", "అ"],
  ["e", "ఎ"],
  ["i", "ఇ"],
  ["o", "ఒ"],
  ["u", "ఉ"]
];
const VOWEL_SIGNS = [
  ["aa", "ా"],
  ["ai", "ై"],
  ["au", "ౌ"],
  ["ee", "ీ"],
  ["oo", "ూ"],
  ["ou", "ౌ"],
  ["ow", "ౌ"],
  ["a", ""],
  // inherent 'a' vowel — no sign needed
  ["e", "ె"],
  ["i", "ి"],
  ["o", "ొ"],
  ["u", "ు"]
];
function matchConsonant(str, pos) {
  const remaining = str.substring(pos);
  for (const [pattern, telugu] of CONSONANTS) {
    if (remaining.startsWith(pattern)) {
      return { telugu, len: pattern.length };
    }
  }
  return null;
}
function matchStandaloneVowel(str, pos) {
  const remaining = str.substring(pos);
  for (const [pattern, telugu] of VOWELS_STANDALONE) {
    if (remaining.startsWith(pattern)) {
      return { telugu, len: pattern.length };
    }
  }
  return null;
}
function matchVowelSign(str, pos) {
  const remaining = str.substring(pos);
  if (remaining === "y") {
    return { sign: "ి", len: 1 };
  }
  for (const [pattern, sign] of VOWEL_SIGNS) {
    if (remaining.startsWith(pattern)) {
      return { sign, len: pattern.length };
    }
  }
  return null;
}
function transliterateWord(word) {
  const lower = word.toLowerCase();
  const len = lower.length;
  let result = "";
  let i = 0;
  while (i < len) {
    const consonant = matchConsonant(lower, i);
    if (consonant) {
      i += consonant.len;
      const vowelSign = matchVowelSign(lower, i);
      if (vowelSign) {
        result += consonant.telugu + vowelSign.sign;
        i += vowelSign.len;
      } else {
        result += consonant.telugu + VIRAMA;
      }
      continue;
    }
    const vowel = matchStandaloneVowel(lower, i);
    if (vowel) {
      result += vowel.telugu;
      i += vowel.len;
      continue;
    }
    result += word[i];
    i++;
  }
  return result;
}
function toTelugu(text) {
  if (!text) return text;
  return text.replace(/[a-zA-Z]+/g, (word) => transliterateWord(word));
}
function NameDisplay({ name, className }) {
  const language = useStore(uiStore, (s) => s.language);
  const displayName = language === "te" ? toTelugu(name) : name;
  return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className, children: displayName });
}
function useLocalizedName(name) {
  const language = useStore(uiStore, (s) => s.language);
  return language === "te" ? toTelugu(name) : name;
}
export {
  NameDisplay as N,
  useLocalizedName as u
};
