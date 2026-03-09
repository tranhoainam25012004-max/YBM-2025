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

let isAllFlipped = false;

function loadSet(idx) {
    const data = allSets[idx];
    if(!data) return;

    // Reset lật thẻ Flashcard
    isAllFlipped = false;
    const btnFlip = document.getElementById('flipAllBtn');
    if(btnFlip) {
        btnFlip.classList.remove('active');
        btnFlip.innerHTML = `<i class="material-icons">import_export</i>`;
    }

    // Cập nhật tiến độ
    const totalSets = allSets.length;
    const progressPercent = Math.round(((idx + 1) / totalSets) * 100);
    document.getElementById('progressBar').style.width = progressPercent + '%';
    document.getElementById('progressText').innerText = progressPercent + '%';
    document.getElementById('progressLabel').innerText = `TIẾN ĐỘ: BỘ ${idx + 1} / ${totalSets}`;

// Reset Panel
    document.getElementById('readingPanel').classList.remove('show-translation', 'show-all-grammar', 'recall-mode', 'hide-ipa'); // Passage luôn hiện IPA
    
    const practicePanel = document.getElementById('practicePanel');
    if (practicePanel) {
        practicePanel.classList.remove('show-translation', 'show-all-grammar', 'recall-mode');
        practicePanel.classList.add('hide-ipa'); // Practice mặc định ẨN IPA
    }
    document.getElementById('quizPanel').classList.remove('show-answers');
    
    // Reset các nút
    document.getElementById('transBtn').classList.remove('active');
    document.getElementById('toggleBtn').classList.remove('active');
    document.getElementById('grammarAllBtn').classList.remove('active');
    document.getElementById('grammarAllBtn').innerHTML = `<i class="material-icons">architecture</i>`;
    document.getElementById('recallBtn').classList.remove('active');
    
    // Reset nút IPA về mặc định (TẮT)
    const ipaBtn = document.getElementById('ipaBtn');
    if(ipaBtn) ipaBtn.classList.remove('active');

    // Render Flashcard
    const flashArea = document.getElementById('flashcardArea');
    if (data.flashcards && data.flashcards.length > 0) {
        const shuffledCards = shuffleArray([...data.flashcards]); 
        flashArea.innerHTML = shuffledCards.map(card => {
            const words = card.word.split('/').map(s => s.trim()).filter(s => s !== "");
            const ipas = card.ipa.split('/').map(s => s.trim()).filter(s => s !== "");
            let wordContent = "";
            
            if (words.length > 1) {
                wordContent = `<div class="word-list">` + 
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
                                <i class="material-icons" style="font-size: 16px;">volume_up</i>
                            </div>
                        </div>`;
                    }).join('') + `</div>`;
            } else {
                wordContent = `
                    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%;">
                        ${card.type ? `<span class="card-type">${card.type}</span>` : ''}
                        <div style="display: flex; align-items: center; justify-content: center; width: 100%;">
                            <h2 class="card-word" style="margin:0; font-weight:800; color:var(--primary);">${card.word}</h2>
                            <div class="speak-btn-circle" onclick="event.stopPropagation(); speak('${card.word.replace(/'/g, "\\'")}');">
                                <i class="material-icons" style="font-size: 20px;">volume_up</i>
                            </div>
                        </div>
                    </div>
                    <div class="card-ipa" style="margin-top:8px;">${card.ipa}</div>
                `;
            }

            return `
            <div class="card-container" onclick="this.classList.toggle('flipped')">
                <div class="card-inner">
                    <div class="card-front">
                        <span class="badge" style="position:absolute; top:20px; right:20px; background:var(--primary-light); color:var(--primary); padding:4px 12px; border-radius:20px; font-size:0.7rem; font-weight:bold;">VOCAB</span>
                        ${wordContent}
                        <div style="margin-top: 20px; width: 100%; display: flex; flex-direction: column; align-items: center; gap: 6px;">
                            <div style="display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%;">
                                <p style="color:#64748b; font-size:0.85rem; line-height:1.6; margin:0; text-align: center; max-width: 80%;">${card.example}</p>
                                <div class="speak-btn-circle speak-small" onclick="event.stopPropagation(); speak('${card.example.replace(/'/g, "\\'")}');" style="margin-left: 0; flex-shrink: 0; width: 28px; height: 28px; background: #eef2ff;">
                                    <i class="material-icons" style="font-size: 16px;">volume_up</i>
                                </div>
                            </div>
                            ${card.exIpa ? `<div class="card-ipa" style="font-size: 0.75rem; margin-top: 0; padding: 2px 10px; background: transparent;">${card.exIpa}</div>` : ''}
                        </div>
                    </div>
                    <div class="card-back">
                        <i class="material-icons" style="font-size:48px; margin-bottom:10px; opacity:0.8;">💡</i>
                        <h4 style="font-size: 1.6rem; margin:0; text-align: center;">${card.meaning}</h4>
                        <div style="width:40px; height:3px; background:white; margin:15px auto; border-radius:10px; opacity:0.5;"></div>
                        <p style="font-size: 1rem; opacity: 0.9; text-align: center;">${card.exMeaning || ''}</p>
                    </div>
                </div>
            </div>`;
        }).join('');
    }

    // Hàm tiện ích tạo HTML cho Reading/Practice
// Hàm tiện ích tạo HTML cho Reading/Practice
    const generatePassageHTML = (arr) => {
        return arr.map(p => {
            // 1. Kiểm tra và tạo khối Ngữ cảnh (nếu có)
            let contextHTML = '';
            if (p.context) {
                contextHTML = `
                    <div class="context-box" style="background: #f8fafc; border-left: 4px solid #64748b; padding: 12px 16px; margin-bottom: 20px; border-radius: 0 8px 8px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
                        <div style="color: #475569; font-weight: 700; font-size: 0.85rem; margin-bottom: 6px; display: flex; align-items: center; gap: 6px; text-transform: uppercase;">
                            <i class="material-icons" style="font-size: 16px;">info</i> Ngữ cảnh cuộc hội thoại
                        </div>
                        <div style="font-size: 0.9rem; color: #334155; line-height: 1.5;">
                            ${p.context}
                        </div>
                    </div>
                `;
            }

            // 2. Tạo các dòng nội dung
            let lines = p.lines.map((l, idx) => `
                <div class="passage-line-group" style="margin-bottom:12px">
                    <div class="en-header" style="display: flex; align-items: flex-start; gap: 10px;">
                        <span style="color: var(--primary); font-weight: normal; font-size: 0.8rem; margin-top: 2px;">${idx + 1}.</span>
                        <span class="en-text" style="font-weight: 400; font-size: 0.95rem; line-height: 1.4; flex-grow: 1;">${l.en}</span>
                        <div class="speak-btn-circle speak-small" onclick="event.stopPropagation(); speak('${l.en.replace(/'/g, "\\'").replace(/"/g, '&quot;')}');" style="margin-left: 0; flex-shrink: 0; margin-top: 2px; width: 28px; height: 28px; background: #eef2ff;">
                            <i class="material-icons" style="font-size: 16px;">volume_up</i>
                        </div>
                    </div>
                    ${l.ipa ? `<div class="ipa-text">${l.ipa}</div>` : ''}
                    <span class="vi-line">${l.vi}</span>
                    ${l.grammar ? `<div class="grammar-analysis">${l.grammar}</div>` : ''}
                    <div class="input-wrapper">
                        <textarea class="recall-input" style="display:none" placeholder="Dịch lại câu này..." oninput="autoHeight(this)"></textarea>
                        <button class="btn-hint" style="display:none" onclick="showHint(this)">
                            <i class="material-icons">lightbulb</i>
                        </button>
                    </div>
                </div>
            `).join('');

            // 3. Gộp Ngữ cảnh và Các dòng nội dung lại
            return `<div class="passage-block">${contextHTML}${lines}</div>`;
        }).join('');
    };

    // Render Passages
    const pBody = document.getElementById('passagesBody');
    if (data.passages && data.passages.length > 0) {
        pBody.innerHTML = generatePassageHTML(data.passages);
    }

    // Render Practices
    const pracBody = document.getElementById('practicesBody');
    if (data.practices && data.practices.length > 0) {
        pracBody.innerHTML = generatePassageHTML(data.practices);
    } else {
        pracBody.innerHTML = "<p style='text-align:center; color:#64748b;'>Chưa có dữ liệu luyện tập cho bộ này.</p>";
    }

    // Render Quiz
    const qBody = document.getElementById('questionsBody');
    if (data.questions && data.questions.length > 0) {
        qBody.innerHTML = data.questions.map((q, qIdx) => `
            <div style="margin-bottom:30px">
                <p style="font-weight:700; margin-bottom: 4px;">Q${qIdx+1}: ${q.q}</p>
                <div class="vi-line" style="color: var(--primary); font-weight: 600; background: #f5f3ff; border-left-color: var(--primary); margin-bottom: 15px; font-size: 0.95rem;">
                    <i class="material-icons" style="font-size: 16px; vertical-align: middle;">translate</i> 
                    ${q.qTrans || 'Đang cập nhật dịch câu hỏi...'}
                </div>
                ${q.options.map((opt, oIdx) => `
                    <label class="option-label ${String.fromCharCode(65+oIdx) === q.ans ? 'is-correct-ans' : ''}">
                        <input type="radio" name="q${qIdx}" style="margin-right:10px"> 
                        <div style="width: 100%;">
                            <div style="font-weight: 500;">${String.fromCharCode(65+oIdx)}. ${opt}</div>
                            <div class="vi-line" style="font-size: 0.85rem; color: #64748b; background: transparent; border: none; padding: 0; margin-top: 4px;">
                                <i class="material-icons" style="font-size: 14px; vertical-align: middle;">translate</i> 
                                ${q.optTrans ? q.optTrans[oIdx] : ''}
                            </div>
                        </div>
                    </label>`).join('')}
                <div class="explanation">
                    <b>✅ Giải thích:</b> ${q.exp}<br><br>
                    <b style="color:#059669">🔍 Logic:</b> ${q.logic}
                    ${q.trap ? `<div class="trap-box"><b>⚠️ Cẩn thận bẫy:</b> ${q.trap}</div>` : ''}
                </div>
            </div>`).join('');
    }

    document.querySelector('.main-content').scrollTop = 0;
}

function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    const clickedBtn = [...document.querySelectorAll('.tab-btn')].find(btn => 
        btn.getAttribute('onclick').includes(tabName)
    );
    if (clickedBtn) clickedBtn.classList.add('active');

    document.querySelectorAll('.content-section').forEach(sec => sec.classList.remove('active'));
    document.getElementById(`section-${tabName}`).classList.add('active');

    document.querySelectorAll('.btn-action').forEach(btn => btn.style.display = 'none');

    if (tabName === 'flashcard') {
        document.querySelectorAll('.control-flashcard').forEach(btn => btn.style.display = 'grid');
    } else if (tabName === 'passage') { 
        // Tab Bài đọc: Chỉ hiện các nút chung của passage, KHÔNG hiện nút IPA
        document.querySelectorAll('.control-passage').forEach(btn => btn.style.display = 'grid');
    } else if (tabName === 'practice') { 
        // Tab Luyện tập: Hiện cả nút chung và nút IPA
        document.querySelectorAll('.control-passage').forEach(btn => btn.style.display = 'grid');
        document.querySelectorAll('.control-practice').forEach(btn => btn.style.display = 'grid');
    } else if (tabName === 'quiz') {
        document.querySelectorAll('.control-quiz').forEach(btn => btn.style.display = 'grid');
    }

    document.querySelector('.main-content').scrollTop = 0;
}

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
    
    panels.forEach(panel => {
        if(panel) panel.classList.toggle('show-all-grammar', isActive);
    });
    
    btn.innerHTML = isActive ? 
        `<i class="material-icons">auto_stories</i>` : 
        `<i class="material-icons">architecture</i>`;
}

function toggleTranslation() { 
    const panels = [document.getElementById('readingPanel'), document.getElementById('practicePanel')];
    const btn = document.getElementById('transBtn');
    
    const isActive = !btn.classList.contains('active');
    btn.classList.toggle('active', isActive);

    panels.forEach(panel => {
        if(panel) panel.classList.toggle('show-translation', isActive);
    });
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
        document.querySelector('.main-content').scrollTop = 0;
    }
}

function toggleFlipAll() {
    const cards = document.querySelectorAll('.card-container');
    const btn = document.getElementById('flipAllBtn');
    
    isAllFlipped = !isAllFlipped;
    
    cards.forEach(card => {
        if (isAllFlipped) {
            card.classList.add('flipped');
        } else {
            card.classList.remove('flipped');
        }
    });

    btn.classList.toggle('active', isAllFlipped);
    btn.innerHTML = isAllFlipped ? 
        `<i class="material-icons">unfold_less</i>` : 
        `<i class="material-icons">import_export</i>`;
}

function speak(text) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        // Lọc bỏ các thẻ HTML (như <b>Morgan:</b>) trước khi đọc để giọng đọc tự nhiên hơn
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
        input.style.background = "white";
        btn.innerHTML = `<i class="material-icons">lightbulb</i>`;
        btn.classList.remove('active-hint');
    } else {
        input.value = originalValue;
        input.style.borderColor = "#4f46e5";
        input.style.background = "#eef2ff";
        btn.innerHTML = `<i class="material-icons">lightbulb_outline</i>`;
        btn.classList.add('active-hint');
        
        autoHeight(input);
        
        input.classList.add('shake');
        setTimeout(() => input.classList.remove('shake'), 300);
    }
}

function autoHeight(element) {
    element.style.height = "5px"; 
    element.style.height = (element.scrollHeight) + "px";
}

document.addEventListener('input', function(e) {
    if (e.target.classList.contains('recall-input')) {
        const userInput = e.target.value.trim().toLowerCase();
        // Lấy text và lọc luôn thẻ HTML để so sánh chính xác
        const originalText = e.target.parentElement.querySelector('.en-text').innerText.trim().toLowerCase();
        
        const cleanOriginal = originalText.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"").replace(/<[^>]*>?/gm, '');
        const cleanUser = userInput.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");

        if (cleanUser === cleanOriginal) {
            e.target.style.borderColor = "#22c55e";
            e.target.style.background = "#f0fdf4";
        } else {
            e.target.style.borderColor = "#e2e8f0";
            e.target.style.background = "white";
        }
    }
});

// Hàm mới: Ẩn/Hiện IPA
function toggleIPA() {
    // Chỉ lấy practicePanel ra để xử lý
    const panel = document.getElementById('practicePanel');
    const btn = document.getElementById('ipaBtn');
    
    // Đảo ngược trạng thái của nút
    const isActive = !btn.classList.contains('active');
    btn.classList.toggle('active', isActive);

    // Nếu nút đang active (Bật) thì xóa class hide-ipa đi để hiện chữ. 
    // Nếu nút không active (Tắt) thì thêm class hide-ipa vào để giấu chữ.
    if(panel) {
        panel.classList.toggle('hide-ipa', !isActive);
    }
}

window.onload = () => {
    if (typeof allSets !== 'undefined') {
        initNav();
        loadSet(0);
        switchTab('flashcard');
    }
};