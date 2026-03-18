let currentFlashcards = [];
let currentCardIdx = 0;
let isViToEn = false;

function shuffleArray(array) {
    let shuffled = [...array]; 
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function initNav() {
    const navList = document.getElementById('navList');
    allSets.forEach((set, idx) => {
        const div = document.createElement('div');
        div.className = `nav-item ${idx === 0 ? 'active' : ''}`;
        div.innerHTML = `<i class="material-icons">menu_book</i> <span>Bộ ${set.range}</span>`;
        div.onclick = (e) => { 
            loadSet(idx); 
            document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active')); 
            e.currentTarget.classList.add('active'); 
        };
        navList.appendChild(div);
    });
}

let currentSubTab = 'flashcard-view'; 

function loadSet(idx) {
    const data = allSets[idx];
    if(!data) return;

    // Reset trạng thái
    isViToEn = false; 
    const swapBtn = document.getElementById('swapModeBtn');
    if(swapBtn) swapBtn.classList.remove('active');

    // Reset Panels
    const readingPanel = document.getElementById('readingPanel');
    const practicePanel = document.getElementById('practicePanel');
    const quizPanel = document.getElementById('quizPanel');

    if(readingPanel) readingPanel.classList.remove('show-translation', 'show-all-grammar', 'recall-mode', 'hide-ipa');
    if(practicePanel) {
        practicePanel.classList.remove('show-translation', 'show-all-grammar', 'recall-mode');
        practicePanel.classList.add('hide-ipa'); 
    }
    if(quizPanel) quizPanel.classList.remove('show-answers');
    
    ['transBtn', 'toggleBtn', 'grammarAllBtn', 'recallBtn', 'ipaBtn'].forEach(id => {
        const btn = document.getElementById(id);
        if(btn) btn.classList.remove('active');
    });
    
    const grammarBtn = document.getElementById('grammarAllBtn');
    if(grammarBtn) grammarBtn.innerHTML = `<i class="material-icons">architecture</i>`;

    // Render Flashcard Slider MỚI
    const flashArea = document.getElementById('flashcardArea');
    if (flashArea && data.flashcards && data.flashcards.length > 0) {
        currentFlashcards = shuffleArray([...data.flashcards]);
        currentCardIdx = 0;
        renderFlashcardUI();
    } else if (flashArea) {
        flashArea.innerHTML = "<p style='text-align:center; color:#64748b;'>Không có từ vựng cho bộ này.</p>";
    }

    // Render Passages
    const generatePassageHTML = (arr) => {
        return arr.map(p => {
            let contextHTML = '';
            if (p.context) {
                contextHTML = `
                    <div class="context-box" style="background: #f8fafc; border-left: 4px solid #64748b; padding: 16px 20px; margin-bottom: 24px; border-radius: 0 12px 12px 0; border: 1px solid #e2e8f0; border-left-width: 4px;">
                        <div style="color: #475569; font-weight: 700; font-size: 0.85rem; margin-bottom: 8px; display: flex; align-items: center; gap: 8px; text-transform: uppercase; letter-spacing: 0.5px;">
                            <i class="material-icons" style="font-size: 18px;">info</i> Ngữ cảnh hội thoại
                        </div>
                        <div style="font-size: 0.95rem; color: #334155; line-height: 1.6;">${p.context}</div>
                    </div>
                `;
            }

            let lines = p.lines.map((l, idx) => `
                <div class="passage-line-group">
                    <div class="left-controls">
                        <span style="color: var(--primary); font-weight: 700; font-size: 1.05rem;">${idx + 1}.</span>
                        <div class="speak-btn-circle speak-small" onclick="event.stopPropagation(); speak('${l.en.replace(/'/g, "\\'").replace(/"/g, '&quot;')}');">
                            <i class="material-icons" style="font-size: 18px;">volume_up</i>
                        </div>
                        <button class="btn-hint" style="display:none" onclick="showHint(this)">
                            <i class="material-icons">lightbulb</i>
                        </button>
                    </div>

                    <div class="right-content">
                        <span class="en-text">${l.en}</span>
                        ${l.ipa ? `<div class="ipa-text">${l.ipa}</div>` : ''}
                        <span class="vi-line">${l.vi}</span>
                        ${l.grammar ? `<div class="grammar-analysis">${l.grammar}</div>` : ''}
                        <div class="input-wrapper" style="margin-top: 4px;">
                            <textarea class="recall-input" style="display:none" placeholder="Dịch lại câu này..." oninput="autoHeight(this)"></textarea>
                        </div>
                    </div>
                </div>
            `).join('');

            return `<div class="passage-block">${contextHTML}${lines}</div>`;
        }).join('');
    };

    const pBody = document.getElementById('passagesBody');
    if (pBody && data.passages) pBody.innerHTML = generatePassageHTML(data.passages);

    const pracBody = document.getElementById('practicesBody');
    if (pracBody) {
        if (data.practices && data.practices.length > 0) {
            pracBody.innerHTML = generatePassageHTML(data.practices);
        } else {
            pracBody.innerHTML = `<div style="text-align:center; padding: 40px; color:var(--text-muted); background: white; border-radius: 16px; border: 1px dashed #cbd5e1;"><i class="material-icons" style="font-size: 48px; opacity: 0.5; margin-bottom: 16px;">inventory_2</i><br>Chưa có dữ liệu luyện tập cho bộ này.</div>`;
        }
    }

    const qBody = document.getElementById('questionsBody');
    if (qBody && data.questions && data.questions.length > 0) {
        qBody.innerHTML = data.questions.map((q, qIdx) => `
            <div class="passage-block" style="margin-bottom:24px">
                <p style="font-weight:700; font-size: 1.1rem; margin-top: 0; margin-bottom: 12px; color: var(--text-main);">Câu ${qIdx+1}: ${q.q}</p>
                <div class="vi-line" style="color: var(--primary); background: var(--primary-light); border-left-color: var(--primary); margin-bottom: 20px; display: block;">
                    <i class="material-icons" style="font-size: 18px; vertical-align: text-bottom; margin-right: 4px;">translate</i> 
                    ${q.qTrans || 'Đang cập nhật dịch câu hỏi...'}
                </div>
                
                <div style="display: flex; flex-direction: column; gap: 8px;">
                    ${q.options.map((opt, oIdx) => `
                        <label class="option-label ${String.fromCharCode(65+oIdx) === q.ans ? 'is-correct-ans' : ''}">
                            <input type="radio" name="q${qIdx}" style="margin-right:12px; flex-shrink: 0;"> 
                            <div style="width: 100%;">
                                <div style="font-weight: 500; color: var(--text-main); font-size: 1.05rem;">${String.fromCharCode(65+oIdx)}. ${opt}</div>
                                <div class="vi-line" style="font-size: 0.9rem; color: var(--text-muted); background: transparent; border: none; padding: 0; margin-top: 6px; display: block;">
                                    <i class="material-icons" style="font-size: 16px; vertical-align: text-bottom; opacity: 0.7;">translate</i> 
                                    ${q.optTrans ? q.optTrans[oIdx] : ''}
                                </div>
                            </div>
                        </label>`).join('')}
                </div>

                <div class="explanation">
                    <div style="margin-bottom: 12px;"><b style="color: #0f172a;"><i class="material-icons" style="font-size: 18px; vertical-align: text-bottom; color: var(--success);">check_circle</i> Giải thích:</b> ${q.exp}</div>
                    <div><b style="color:var(--primary);"><i class="material-icons" style="font-size: 18px; vertical-align: text-bottom;">psychology</i> Logic:</b> ${q.logic}</div>
                    ${q.trap ? `<div class="trap-box"><i class="material-icons" style="font-size: 18px; vertical-align: text-bottom;">warning</i> <b>Cẩn thận bẫy:</b> ${q.trap}</div>` : ''}
                </div>
            </div>`).join('');
    }

    const mainContent = document.querySelector('.main-content');
    if(mainContent) mainContent.scrollTop = 0;
}

function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    const clickedBtn = [...document.querySelectorAll('.tab-btn')].find(btn => btn.getAttribute('onclick').includes(tabName));
    if (clickedBtn) clickedBtn.classList.add('active');

    document.querySelectorAll('.content-section').forEach(sec => sec.classList.remove('active'));
    document.getElementById(`section-${tabName}`).classList.add('active');

    document.querySelectorAll('.btn-action').forEach(btn => btn.style.display = 'none');

    const vocabToggle = document.getElementById('vocabSubTabs');
    if (vocabToggle) {
        vocabToggle.style.display = (tabName === 'flashcard') ? 'flex' : 'none';
    }

    if (tabName === 'flashcard') {
        switchSubTab(currentSubTab);
    } else if (tabName === 'passage') { 
        document.querySelectorAll('.control-passage').forEach(btn => btn.style.display = 'grid');
    } else if (tabName === 'quiz') {
        document.querySelectorAll('.control-quiz').forEach(btn => btn.style.display = 'grid');
    }

    const mainContent = document.querySelector('.main-content');
    if(mainContent) mainContent.scrollTop = 0;
}

function switchSubTab(subTabName) {
    currentSubTab = subTabName; 
    document.querySelectorAll('.vocab-toggle-btn').forEach(btn => btn.classList.remove('active'));
    const activeBtn = [...document.querySelectorAll('.vocab-toggle-btn')].find(btn => btn.getAttribute('onclick').includes(subTabName));
    if (activeBtn) activeBtn.classList.add('active');

    document.querySelectorAll('.sub-view').forEach(view => view.style.display = 'none');
    document.getElementById(subTabName).style.display = 'block';

    document.querySelectorAll('.btn-action').forEach(btn => btn.style.display = 'none');
    
    if (subTabName === 'flashcard-view') {
        document.querySelectorAll('.control-flashcard').forEach(btn => btn.style.display = 'grid');
    } else if (subTabName === 'practice-view') {
        document.querySelectorAll('.control-passage').forEach(btn => btn.style.display = 'grid');
        document.querySelectorAll('.control-practice').forEach(btn => btn.style.display = 'grid');
    }
}

// LOGIC SLIDER 1 THẺ & ĐẢO CHIỀU 3D
// LOGIC SLIDER 1 THẺ & ĐẢO CHIỀU 3D
function renderFlashcardUI() {
    const flashArea = document.getElementById('flashcardArea');
    if (!flashArea || currentFlashcards.length === 0) return;

    const card = currentFlashcards[currentCardIdx];
    const words = card.word.split('/').map(s => s.trim()).filter(s => s !== "");
    const ipas = card.ipa ? card.ipa.split('/').map(s => s.trim()).filter(s => s !== "") : [];

    // 1. TẠO MẶT TIẾNG ANH
    let englishContent = "";
    if (words.length > 1) {
        englishContent = `<div class="word-list" style="max-height: 250px;">` +
            words.map((w, i) => {
                const currentIpa = ipas[i] || ipas[0] || "";
                return `
                <div class="word-item">
                    <div class="word-item-text">
                        ${card.type ? `<span class="card-type">${card.type}</span>` : ''}
                        <span class="word-main">${w}</span>
                        ${currentIpa ? `<span class="word-ipa-small">${currentIpa}</span>` : ''}
                    </div>
                    <div class="speak-btn-circle speak-small" onclick="event.stopPropagation(); speak('${w.replace(/'/g, "\\'")}');">
                        <i class="material-icons">volume_up</i>
                    </div>
                </div>`;
            }).join('') + `</div>`;
    } else {
        englishContent = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%;">
                ${card.type ? `<span class="card-type" style="margin-bottom: 12px;">${card.type}</span>` : ''}
                <div style="display: flex; align-items: center; justify-content: center; width: 100%;">
                    <h2 class="card-word">${card.word}</h2>
                    <div class="speak-btn-circle" onclick="event.stopPropagation(); speak('${card.word.replace(/'/g, "\\'")}');">
                        <i class="material-icons">volume_up</i>
                    </div>
                </div>
            </div>
            <div class="card-ipa">${card.ipa}</div>
        `;
    }

    // ĐÃ KHÔI PHỤC exIpa Ở ĐÂY VỚI KHUNG VIỀN ĐỨT NÉT TINH TẾ
    englishContent += `
        <div style="margin-top: 24px; width: 100%; display: flex; flex-direction: column; align-items: center; gap: 8px;">
            <div style="display: flex; align-items: flex-start; justify-content: center; gap: 12px; width: 100%;">
                <p class="card-example-text" style="color:inherit;">${card.example}</p>
                <div class="speak-btn-circle speak-small" onclick="event.stopPropagation(); speak('${card.example.replace(/'/g, "\\'")}');" style="margin-left: 0; flex-shrink: 0;">
                    <i class="material-icons">volume_up</i>
                </div>
            </div>
            ${card.exIpa ? `<div class="card-ipa" style="font-size: 0.85rem; margin-top: 4px; padding: 4px 12px; background: transparent; border: 1px dashed currentColor; opacity: 0.8;">${card.exIpa}</div>` : ''}
        </div>
    `;

    // 2. TẠO MẶT TIẾNG VIỆT
    const vietnameseContent = `
        <i class="material-icons" style="font-size:48px; margin-bottom:16px; opacity:0.9;">lightbulb</i>
        <h4 class="card-meaning-text">${card.meaning}</h4>
        <div class="divider-line"></div>
        <p class="card-exmeaning-text">${card.exMeaning || ''}</p>
    `;

    let frontContent = isViToEn ? vietnameseContent : englishContent;
    let backContent = isViToEn ? englishContent : vietnameseContent;

    // 3. GẮP VÀO GIAO DIỆN (1 Thẻ 3D + Nút trượt + List)
    let html = `
    <div style="width: 100%; max-width: 500px; display: flex; flex-direction: column; gap: 16px;">
        
        <div class="card-container" onclick="this.classList.toggle('flipped')">
            <div class="card-inner">
                <div class="card-front">
                    <span class="badge badge-front">${isViToEn ? 'NGHĨA' : 'VOCAB'}</span>
                    ${frontContent}
                </div>
                <div class="card-back">
                    <span class="badge badge-back">${isViToEn ? 'VOCAB' : 'NGHĨA'}</span>
                    ${backContent}
                </div>
            </div>
        </div>

        <div class="learning-actions">
            <button class="btn-known" onclick="nextFlashcard()"><i class="material-icons" style="font-size:18px;">check</i> Đã thuộc</button>
            <button class="btn-unknown" onclick="nextFlashcard()"><i class="material-icons" style="font-size:18px;">close</i> Chưa thuộc</button>
        </div>

        <div class="learning-pagination">
            <button class="btn-page" onclick="prevFlashcard()"><i class="material-icons">chevron_left</i></button>
            <span>${currentCardIdx + 1} / ${currentFlashcards.length}</span>
            <button class="btn-page" onclick="nextFlashcard()"><i class="material-icons">chevron_right</i></button>
        </div>

    </div>

    <div class="vocab-list-container" style="width: 100%; max-width: 500px; margin-top: 16px;">
        <div class="list-header">
            <span><i class="material-icons" style="vertical-align: middle; margin-right:4px;">list</i> Danh sách từ vựng</span>
        </div>
        ${currentFlashcards.map((c, i) => `
            <div class="list-item" style="${i === currentCardIdx ? 'background:#eff6ff; border-left: 4px solid var(--primary); padding-left: 12px;' : 'padding-left: 16px;'}" onclick="goToCard(${i})">
                <div class="list-item-num" style="${i === currentCardIdx ? 'background:#ea580c; color: white;' : ''}">${i + 1}</div>
                <div class="list-item-word" style="color: ${i === currentCardIdx ? '#ea580c' : 'var(--text-main)'}">${c.word.replace(/\//g, ' • ')}</div>
                <div style="color: var(--text-muted); font-size:0.9rem;">${c.meaning}</div>
            </div>
        `).join('')}
    </div>
    `;

    flashArea.innerHTML = html;
}

// CÁC HÀM ĐIỀU KHIỂN TRƯỢT THẺ
function toggleFlashcardMode() {
    isViToEn = !isViToEn;
    const btn = document.getElementById('swapModeBtn');
    if (btn) btn.classList.toggle('active', isViToEn);
    renderFlashcardUI(); // Vẽ lại thẻ theo chiều mới
}

function nextFlashcard() {
    if (currentCardIdx < currentFlashcards.length - 1) {
        currentCardIdx++;
        renderFlashcardUI();
    } else {
        alert("Chúc mừng! Bạn đã hoàn thành bộ từ vựng này.");
    }
}

function prevFlashcard() {
    if (currentCardIdx > 0) {
        currentCardIdx--;
        renderFlashcardUI();
    }
}

function goToCard(idx) {
    currentCardIdx = idx;
    renderFlashcardUI();
    // Cuộn nhẹ lên đầu thẻ để dễ nhìn
    document.querySelector('.main-content').scrollTop = 0;
}

// Các hàm phụ trợ giữ nguyên
function toggleAnswers() { 
    const panel = document.getElementById('quizPanel');
    const btn = document.getElementById('toggleBtn');
    const isActive = panel.classList.toggle('show-answers');
    btn.classList.toggle('active', isActive);
}

function toggleAllGrammar() {
    const panels = [document.getElementById('readingPanel'), document.getElementById('practicePanel')];
    const btn = document.getElementById('grammarAllBtn');
    const isActive = !btn.classList.contains('active');
    btn.classList.toggle('active', isActive);
    panels.forEach(panel => { if(panel) panel.classList.toggle('show-all-grammar', isActive); });
    btn.innerHTML = isActive ? `<i class="material-icons">auto_stories</i>` : `<i class="material-icons">architecture</i>`;
}

function toggleTranslation() { 
    const panels = [document.getElementById('readingPanel'), document.getElementById('practicePanel')];
    const btn = document.getElementById('transBtn');
    const isActive = !btn.classList.contains('active');
    btn.classList.toggle('active', isActive);
    panels.forEach(panel => { if(panel) panel.classList.toggle('show-translation', isActive); });
}

function toggleRecallMode() {
    const panels = [document.getElementById('readingPanel'), document.getElementById('practicePanel')];
    const btn = document.getElementById('recallBtn');
    const inputs = document.querySelectorAll('.recall-input');
    const hints = document.querySelectorAll('.btn-hint');
    
    const isRecallActive = !btn.classList.contains('active');
    btn.classList.toggle('active', isRecallActive);

    panels.forEach(panel => {
        if(panel) {
            panel.classList.toggle('recall-mode', isRecallActive);
            if (isRecallActive) panel.classList.remove('show-translation');
        }
    });

    inputs.forEach(input => {
        input.style.display = isRecallActive ? 'block' : 'none';
        if (isRecallActive) input.value = ""; 
    });

    hints.forEach(hint => {
        hint.style.display = isRecallActive ? 'grid' : 'none';
        if (!isRecallActive) {
            hint.innerHTML = `<i class="material-icons" style="font-size: 20px;">lightbulb</i>`;
            hint.classList.remove('active-hint');
        }
    });

    if (isRecallActive) {
        document.getElementById('transBtn').classList.remove('active');
        const mainContent = document.querySelector('.main-content');
        if(mainContent) mainContent.scrollTop = 0;
    }
}

function toggleFlipAll() {
    // Không cần dùng cho giao diện 1 thẻ nữa, nhưng giữ để không lỗi nút HTML cũ
    const cards = document.querySelectorAll('.card-container');
    cards.forEach(card => card.classList.toggle('flipped'));
}

function speak(text) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const cleanText = text.replace(/<[^>]*>?/gm, '');
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = 'en-US'; 
        utterance.rate = 1; 
        window.speechSynthesis.speak(utterance);
    } else {
        alert("Trình duyệt của bạn không hỗ trợ tính năng đọc văn bản.");
    }
}

function showHint(btn) {
    const group = btn.closest('.passage-line-group');
    const enText = group.querySelector('.en-text');
    const input = group.querySelector('.recall-input');
    const originalValue = enText.innerText.trim();

    if (input.value === originalValue) {
        input.value = "";
        input.style.borderColor = "#e2e8f0";
        input.style.background = "var(--surface)";
        btn.innerHTML = `<i class="material-icons">lightbulb</i>`;
        btn.classList.remove('active-hint');
    } else {
        input.value = originalValue;
        input.style.borderColor = "var(--primary)";
        input.style.background = "var(--primary-light)";
        btn.innerHTML = `<i class="material-icons">lightbulb_outline</i>`;
        btn.classList.add('active-hint');
        autoHeight(input);
        input.classList.remove('shake');
        void input.offsetWidth; 
        input.classList.add('shake');
    }
}

function autoHeight(element) {
    element.style.height = "50px"; 
    element.style.height = (element.scrollHeight) + "px";
}

document.addEventListener('input', function(e) {
    if (e.target.classList.contains('recall-input')) {
        const userInput = e.target.value.trim().toLowerCase();
        const originalText = e.target.parentElement.parentElement.querySelector('.en-text').innerText.trim().toLowerCase();
        
        const cleanOriginal = originalText.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"").replace(/<[^>]*>?/gm, '');
        const cleanUser = userInput.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");

        if (cleanUser === cleanOriginal && cleanUser !== "") {
            e.target.style.borderColor = "var(--success)";
            e.target.style.background = "var(--success-bg)";
            e.target.style.color = "#065f46";
        } else {
            e.target.style.borderColor = "#e2e8f0";
            e.target.style.background = "var(--surface)";
            e.target.style.color = "var(--text-main)";
        }
    }
});

function toggleIPA() {
    const panel = document.getElementById('practicePanel');
    const btn = document.getElementById('ipaBtn');
    const isActive = !btn.classList.contains('active');
    btn.classList.toggle('active', isActive);
    if(panel) panel.classList.toggle('hide-ipa', !isActive);
}

window.onload = () => {
    if (typeof allSets !== 'undefined') {
        initNav();
        loadSet(0);
        switchTab('flashcard');
    }
};