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
//       vocab:     { "d1-v06": "known" | "unknown" | null },
//       listen:    { "d1-hw1-03": { picked: "B", correct: false, tries: 2 } },
//       trans:     { "d1-tr01": { done: true, correct: true, marks: {}, draft: "" } },
//       picture:   { "d1-pic-clothes-01": "cap" },
//       dictation: { "d1-p11-01": ["is typing on a keyboard", "", ""] },
//       updatedAt: "2026-09-04T10:22:00.000Z"
//   } }
//
// Doc trên Firestore ở progress/<uid>/days/<slug>, với uid là người đang đăng
// nhập (xem components/AuthProvider). Ẩn danh thì uid gắn với đúng trình duyệt
// này; đăng nhập Google rồi thì uid theo người, mở máy nào cũng là một tiến độ.

import { useCallback, useEffect, useRef, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { EMPTY, mergeDay, readDay, writeDay } from './store';
import { useAuth } from '@/components/AuthProvider';
import { countQuestions } from './days';

const SYNC_DELAY = 1200; // gộp nhiều thay đổi liên tiếp thành một lần ghi

export function useProgress(daySlug) {
  const { uid, cloud } = useAuth();

  // Không đọc localStorage lúc render đầu — server và client phải khớp,
  // nếu không React báo hydration mismatch.
  const [day, setDay] = useState(EMPTY);
  const [ready, setReady] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const timerRef = useRef(null);
  const latestRef = useRef(EMPTY);

  // 1) Đọc local trước để render ngay.
  // 2) Rồi lấy bản trên Firestore và GỘP hai bên — không bên nào đè bên nào.
  // Chạy lại mỗi khi uid đổi (đăng nhập / đăng xuất).
  useEffect(() => {
    let alive = true;

    const local = readDay(daySlug);
    latestRef.current = local;
    setDay(local);
    setReady(true);

    if (!cloud || !uid) return undefined;

    (async () => {
      const ref = doc(db(), 'progress', uid, 'days', daySlug);
      let remote;
      try {
        const snap = await getDoc(ref);
        if (!alive || !snap.exists()) return;
        remote = { ...EMPTY, ...snap.data() };
      } catch (e) {
        console.warn('[progress] không đọc được tiến độ từ Firestore:', e.message);
        return;
      }

      const merged = mergeDay(latestRef.current, remote);
      if (!alive) return;
      latestRef.current = merged;
      setDay(merged);
      writeDay(daySlug, merged);

      // Bản gộp có gì mà cloud chưa có thì đẩy ngược lên, để máy kia mở ra là thấy.
      if (JSON.stringify(merged) !== JSON.stringify(remote)) {
        try {
          await setDoc(ref, merged);
        } catch (e) {
          console.warn('[progress] không ghi được bản gộp lên Firestore:', e.message);
        }
      }
    })();

    return () => {
      alive = false;
    };
  }, [daySlug, uid, cloud]);

  /** Đẩy lên Firestore, có debounce. Lỗi mạng thì bỏ qua — local vẫn giữ nguyên. */
  const scheduleSync = useCallback(
    (next) => {
      if (!cloud || !uid) return;
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(async () => {
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
    [daySlug, uid, cloud],
  );

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const write = useCallback(
    (updater) => {
      const next = { ...updater(latestRef.current), updatedAt: new Date().toISOString() };
      latestRef.current = next;
      setDay(next);
      writeDay(daySlug, next);
      scheduleSync(next);
    },
    [daySlug, scheduleSync],
  );

  const setVocab = useCallback(
    (id, status) => write((p) => ({ ...p, vocab: { ...p.vocab, [id]: status } })),
    [write],
  );

  /**
   * Học lại từ đầu. Ghi `null` cho từng id thay vì xóa trắng object: xóa trắng
   * thì lần gộp sau bản trên cloud lại dựng hết dậy. `null` là bia mộ, nó đè
   * được lên giá trị cũ nên việc reset mới truyền sang máy khác.
   */
  const resetVocab = useCallback(
    () =>
      write((p) => ({
        ...p,
        vocab: Object.fromEntries(Object.keys(p.vocab).map((id) => [id, null])),
      })),
    [write],
  );

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
    cloud,
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
