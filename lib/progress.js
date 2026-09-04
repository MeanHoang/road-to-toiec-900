'use client';

// TIẾN ĐỘ học — tách hẳn khỏi NỘI DUNG.
//
// Hai tầng, cố ý:
//   localStorage  ghi ngay, đọc ngay, chạy được cả khi mất mạng   → là nguồn dùng để render
//   Firestore     đồng bộ nền, để đổi máy vẫn còn tiến độ          → là nguồn dùng chung
//
// Vì sao localStorage vẫn giữ dù đã có Firestore: mỗi lần lật một cái thẻ mà phải
// chờ round-trip mạng thì dùng rất khó chịu, và mất mạng là app đơ. Ghi local trước,
// đẩy lên sau — người học không bao giờ phải chờ.
//
//   { "day-1": {
//       vocab:     { "d1-v06": "known" | "unknown" },
//       listen:    { "d1-hw1-03": { picked: "B", correct: false, tries: 2 } },
//       trans:     { "d1-tr01": { done: true, correct: true, marks: {}, draft: "" } },
//       picture:   { "d1-pic-clothes-01": "cap" },
//       dictation: { "d1-p11-01": ["is typing on a keyboard", "", ""] },
//       updatedAt: "2026-09-04T10:22:00.000Z"
//   } }

import { useCallback, useEffect, useRef, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, currentUid, isConfigured } from './firebase';
import { countQuestions } from './days';

const KEY = 'toeic900';
const SYNC_DELAY = 1200; // gộp nhiều thay đổi liên tiếp thành một lần ghi

const EMPTY = { vocab: {}, listen: {}, trans: {}, picture: {}, dictation: {} };

function readAll() {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(window.localStorage.getItem(KEY) || '{}');
  } catch {
    return {};
  }
}

function writeAll(all) {
  window.localStorage.setItem(KEY, JSON.stringify(all));
}

export function useProgress(daySlug) {
  // Không đọc localStorage lúc render đầu — server và client phải khớp,
  // nếu không React báo hydration mismatch.
  const [day, setDay] = useState(EMPTY);
  const [ready, setReady] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const uidRef = useRef(null);
  const timerRef = useRef(null);
  const latestRef = useRef(EMPTY);

  // 1) Đọc local trước để render ngay.
  // 2) Rồi lấy bản trên Firestore, cái nào mới hơn thì thắng.
  useEffect(() => {
    let alive = true;
    const local = { ...EMPTY, ...(readAll()[daySlug] || {}) };
    latestRef.current = local;
    setDay(local);
    setReady(true);

    if (!isConfigured) return;

    (async () => {
      const uid = await currentUid();
      if (!alive || !uid) return;
      uidRef.current = uid;

      try {
        const snap = await getDoc(doc(db(), 'progress', uid, 'days', daySlug));
        if (!alive || !snap.exists()) return;

        const remote = { ...EMPTY, ...snap.data() };
        // So bằng updatedAt: chỉ lấy bản xa khi nó thực sự mới hơn bản ở máy này.
        if (!local.updatedAt || (remote.updatedAt && remote.updatedAt > local.updatedAt)) {
          latestRef.current = remote;
          setDay(remote);
          const all = readAll();
          all[daySlug] = remote;
          writeAll(all);
        }
      } catch (e) {
        console.warn('[progress] không đọc được tiến độ từ Firestore:', e.message);
      }
    })();

    return () => {
      alive = false;
    };
  }, [daySlug]);

  /** Đẩy lên Firestore, có debounce. Lỗi mạng thì bỏ qua — local vẫn giữ nguyên. */
  const scheduleSync = useCallback(
    (next) => {
      if (!isConfigured) return;
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(async () => {
        const uid = uidRef.current || (await currentUid());
        if (!uid) return;
        uidRef.current = uid;
        setSyncing(true);
        try {
          await setDoc(doc(db(), 'progress', uid, 'days', daySlug), next);
        } catch (e) {
          console.warn('[progress] không ghi được lên Firestore:', e.message);
        } finally {
          setSyncing(false);
        }
      }, SYNC_DELAY);
    },
    [daySlug],
  );

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const write = useCallback(
    (updater) => {
      const next = { ...updater(latestRef.current), updatedAt: new Date().toISOString() };
      latestRef.current = next;
      setDay(next);

      const all = readAll();
      all[daySlug] = next;
      writeAll(all);

      scheduleSync(next);
    },
    [daySlug, scheduleSync],
  );

  const setVocab = useCallback(
    (id, status) => write((p) => ({ ...p, vocab: { ...p.vocab, [id]: status } })),
    [write],
  );

  const resetVocab = useCallback(() => write((p) => ({ ...p, vocab: {} })), [write]);

  /** Ghi một lần trả lời câu nghe. Số lần thử cộng dồn để biết khi nào cho bỏ qua. */
  const answer = useCallback(
    (id, picked, correct) =>
      write((p) => {
        const prev = p.listen[id] || { tries: 0 };
        return { ...p, listen: { ...p.listen, [id]: { picked, correct, tries: prev.tries + 1 } } };
      }),
    [write],
  );

  const setTrans = useCallback(
    (id, value) => write((p) => ({ ...p, trans: { ...p.trans, [id]: value ?? null } })),
    [write],
  );

  const setPicture = useCallback(
    (id, value) => write((p) => ({ ...p, picture: { ...p.picture, [id]: value } })),
    [write],
  );

  /** Lưu từng dòng chép chính tả theo id câu. */
  const setDictation = useCallback(
    (id, lines) => write((p) => ({ ...p, dictation: { ...p.dictation, [id]: lines } })),
    [write],
  );

  return {
    day,
    ready,
    syncing,
    cloud: isConfigured,
    setVocab,
    resetVocab,
    answer,
    setTrans,
    setPicture,
    setDictation,
  };
}

/** Đếm tiến độ để hiện ở trang chủ và màn tổng quan. */
export function summarize(progress, day) {
  const known = Object.values(progress.vocab).filter((s) => s === 'known').length;
  const total = day.vocabulary.length;
  const listenTotal = countQuestions(day);
  const listenDone = Object.values(progress.listen).filter((a) => a?.correct).length;
  const transTotal = day.translation.length;
  const transDone = Object.values(progress.trans).filter((t) => t?.done).length;

  const denominator = total + listenTotal + transTotal;
  const percent = denominator
    ? Math.round(((known + listenDone + transDone) / denominator) * 100)
    : 0;

  return { known, total, listenDone, listenTotal, transDone, transTotal, percent };
}
