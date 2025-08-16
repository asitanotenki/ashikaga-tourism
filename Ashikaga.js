// ======================
// モバイルナビ開閉（クラス切替）
// ======================
const btn = document.querySelector('.nav__btn');
const nav = document.getElementById('nav');

/**
 * ナビの開閉をトグルする
 * @param {boolean} [force] - 明示的に開閉を指定（true=開く / false=閉じる）
 */
function toggleNav(force) {
  if (!btn || !nav) return;
  const open = typeof force === 'boolean' ? force : btn.getAttribute('aria-expanded') !== 'true';
  btn.setAttribute('aria-expanded', String(open));
  nav.classList.toggle('is-open', open);
  // モバイル時のみスクロールロック（簡易）
  document.documentElement.classList.toggle('lock', open);
}

if (btn && nav) {
  // クリックで開閉
  btn.addEventListener('click', () => toggleNav());

  // 画面幅がPC幅になったら閉じて状態整理（.lock解除）
  const mql = window.matchMedia('(min-width: 840px)');
  mql.addEventListener?.('change', () => {
    if (mql.matches) toggleNav(false);
  });

  // Escで閉じる（アクセシビリティ）
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') toggleNav(false);
  }, { passive: true });
}

// ======================
// タブ切替（クリック＋キーボード操作）
// ======================
const tabBtns = document.querySelectorAll('.tab');   // タブボタン群を取得
const tabPanels = document.querySelectorAll('.tabp'); // タブの中身パネル群を取得

/**
 * 指定ボタンをアクティブ化し、対応するパネルを表示
 * - aria-selected / tabindex / hidden を適切に更新
 */
function activateTab(btn) {
  const panelId = btn.getAttribute('aria-controls');

  // タブボタン側
  tabBtns.forEach(x => {
    const on = x === btn;
    x.classList.toggle('is-act', on);
    x.setAttribute('aria-selected', String(on));
    x.tabIndex = on ? 0 : -1; // キーボードフォーカスの移動管理
  });

  // パネル側
  tabPanels.forEach(p => {
    const on = p.id === panelId;
    p.classList.toggle('is-act', on);
    if (on) p.removeAttribute('hidden'); else p.setAttribute('hidden', '');
  });

  // フォーカスをアクティブタブに戻す（キーボードUX向上）
  btn.focus();
}

// 初期tabindex整備＆イベント付与
tabBtns.forEach((b, i) => {
  b.tabIndex = b.getAttribute('aria-selected') === 'true' ? 0 : -1;

  // クリックで切替
  b.addEventListener('click', () => activateTab(b));

  // ← → Home End でタブ移動
  b.addEventListener('keydown', (e) => {
    const k = e.key;
    const list = Array.from(tabBtns);
    let idx = i;

    if (k === 'ArrowRight') idx = (i + 1) % list.length;
    else if (k === 'ArrowLeft') idx = (i - 1 + list.length) % list.length;
    else if (k === 'Home') idx = 0;
    else if (k === 'End') idx = list.length - 1;
    else return;

    e.preventDefault();
    activateTab(list[idx]);
  });
});

// ======================
// ヒーロー：CSS変数から背景を設定 + フェード + 省電力
// ======================
const slides = document.querySelectorAll('.hero__slide');
let current = 0;
let timer = null;

/**
 * style属性から --bg:url('パス') を抽出し、グラデ＋画像を適用
 * 例: <div class="hero__slide" style="--bg:url('img/orihime.jpg')"></div>
 */
function applyBgFromVar() {
  slides.forEach(el => {
    const m = el.getAttribute('style')?.match(/--bg:\s*url\(['"]?(.*?)['"]?\)/);
    if (m && m[1]) {
      el.style.backgroundImage =
        `linear-gradient(to bottom, rgba(0,0,0,.25), rgba(0,0,0,.35)), url('${m[1]}')`;
    }
  });
}

/** 指定インデックスのスライドを表示（opacityでフェード） */
function showSlide(index) {
  slides.forEach((slide, i) => {
    slide.classList.toggle('active', i === index);
    slide.setAttribute('aria-hidden', String(i !== index));
  });
}

/** 次のスライドへ */
function nextSlide() {
  if (!slides.length) return;
  current = (current + 1) % slides.length;
  showSlide(current);
}

/** 自動再生開始（prefers-reduced-motion や非アクティブタブでは停止） */
function startSlideShow() {
  stopSlideShow();
  // R/M 環境では自動再生しない
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  // 非表示タブでは止める（visibilitychangeで制御）
  if (document.hidden) return;
  timer = setInterval(nextSlide, 5000); // 5秒ごとに次へ
}

/** 自動再生停止 */
function stopSlideShow() {
  if (timer) { clearInterval(timer); timer = null; }
}

// タブの可視/不可視で自動再生を制御
document.addEventListener('visibilitychange', () => {
  if (document.hidden) stopSlideShow(); else startSlideShow();
}, { passive: true });

// 初期化
document.addEventListener('DOMContentLoaded', () => {
  applyBgFromVar();
  if (slides.length) {
    showSlide(0);     // 最初のスライド表示
    startSlideShow(); // 自動再生開始（条件付き）
  }
});

// ==== サブタブ切替処理 ==== //
const subBtns = document.querySelectorAll('.subtab');  // 春夏秋冬ボタン
const subPanels = document.querySelectorAll('.subtabp'); // その中身

// ==== サブタブ切替処理 ==== //
subBtns.forEach(b => {
  // 各サブタブボタンにクリックイベントを追加
  b.addEventListener('click', () => {

    // --- サブタブボタンの見た目＆状態を更新 ---
    subBtns.forEach(x => {
      x.classList.toggle('is-act', x === b);            // クリックしたボタンだけ .is-act を付ける
      x.setAttribute('aria-selected', String(x === b)); // ARIA属性で選択状態を反映
    });

    // --- サブタブの中身パネルを切り替え ---
    subPanels.forEach(p => {
      const on = p.id === b.getAttribute('aria-controls'); // ボタンに対応するパネルかどうか判定
      p.classList.toggle('is-act', on);                    // 該当パネルに .is-act を付ける
      if (on) p.removeAttribute('hidden');                 // 表示するパネルは hidden を外す
      else p.setAttribute('hidden','');                    // それ以外は hidden を付けて非表示にする
    });
  });
});

