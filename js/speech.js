// Web Speech API(speechSynthesis)를 이용한 영어 발음 읽어주기.
// 받아쓰기 모드에서 단어/문장을 소리로 들려준다.

const Speech = (() => {
  let voices = [];

  function loadVoices() {
    voices = window.speechSynthesis ? window.speechSynthesis.getVoices() : [];
  }

  if (window.speechSynthesis) {
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }

  // 영어(가능하면 미국식) 목소리를 우선 선택한다.
  function pickEnglishVoice() {
    if (!voices.length) loadVoices();
    return (
      voices.find((v) => /en[-_]US/i.test(v.lang)) ||
      voices.find((v) => /^en/i.test(v.lang)) ||
      null
    );
  }

  function supported() {
    return "speechSynthesis" in window;
  }

  // text를 영어로 읽어준다. rate: 0.5(느림) ~ 1(보통)
  function speak(text, rate = 0.9) {
    if (!supported() || !text) return false;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const voice = pickEnglishVoice();
    if (voice) u.voice = voice;
    u.lang = voice ? voice.lang : "en-US";
    u.rate = rate;
    u.pitch = 1;
    window.speechSynthesis.speak(u);
    return true;
  }

  function stop() {
    if (supported()) window.speechSynthesis.cancel();
  }

  return { supported, speak, stop };
})();
