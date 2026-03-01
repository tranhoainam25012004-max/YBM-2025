let currentLessonIndex = 0; 
let currentTab = 'lesson'; // 'lesson' hoặc 'flashcards'

function speak(text) {
    const msg = new SpeechSynthesisUtterance(text);
    msg.lang = 'en-US';
    window.speechSynthesis.speak(msg);
}

function toggleSingleContent(btn, className) {
    const parent = btn.closest('.content-line'); 
    const elements = parent.querySelectorAll('.' + className);
    elements.forEach(el => el.classList.toggle('show'));
    btn.classList.toggle('active-btn');
}

function toggleGroupContent(btn, className) {
    const parent = btn.closest('.lesson-group'); 
    const elements = parent.querySelectorAll('.' + className);
    elements.forEach(el => el.classList.toggle('show'));
    btn.classList.toggle('active-btn');
}

function goToLesson(index) {
    if (index >= 0 && index < allLessons.length) {
        currentLessonIndex = index;
        render();
        window.scrollTo(0, 0); 
    }
}

function render() {
    const app = document.getElementById('app');
    const lesson = allLessons[currentLessonIndex];

    // 1. Menu điều hướng nhanh
    let navHtml = `
        <div class="lesson-nav">
            ${allLessons.map((l, index) => `
                <a href="javascript:void(0)" onclick="goToLesson(${index})" 
                    class="nav-item ${currentLessonIndex === index ? 'active-btn' : ''}">
                    ${l.title}
                </a>
            `).join('')}
        </div>
    `;

    // 2. Thanh chọn TAB
    const tabHtml = `
        <div style="display: flex; justify-content: center; gap: 10px; margin-bottom: 20px;">
            <button class="${currentTab === 'lesson' ? 'active-btn' : ''}" 
                    onclick="currentTab='lesson'; render();">📖 Bài học & Câu hỏi</button>
            <button class="${currentTab === 'flashcards' ? 'active-btn' : ''}" 
                    onclick="currentTab='flashcards'; render();">🗂️ Chỉ Flashcards</button>
        </div>
    `;

    let mainContent = '';

    if (currentTab === 'lesson') {
        mainContent = `
            <div class="lesson-group active">
                <div class="group-header">
                    <div class="group-title">${lesson.title}</div><br>
                    <audio class="audio-player" controls key="${currentLessonIndex}">
                        <source src="${lesson.audioUrl}" type="audio/mpeg">
                    </audio>
                </div>
                
                <div class="section">
                    <h2>Đoạn Hội Thoại</h2>
                    <div class="btn-group">
                        <button onclick="toggleGroupContent(this, 'p-en')">Anh</button>
                        <button onclick="toggleGroupContent(this, 'p-ipa')">IPA</button>
                        <button onclick="toggleGroupContent(this, 'p-guide')">Phát âm</button>
                        <button onclick="toggleGroupContent(this, 'p-vi')">Việt</button>
                        <button onclick="toggleGroupContent(this, 'p-practice')">Luyện viết</button>
                        <button onclick="toggleGroupContent(this, 'p-context')">Bối cảnh</button> 
                        <button onclick="toggleGroupContent(this, 'p-grammar')">Ngữ pháp</button>
                    </div>
                    ${lesson.passage.map(item => `
                        <div class="content-line">
                            <div class="en-text p-en"><strong>${item.en}</strong></div>
                            <div class="ipa-text p-ipa">${item.ipa || ''}</div>
                            <div class="guide-text p-guide">🗣️ ${item.guide || ''}</div>
                            <div class="vi-text p-vi">${item.vi}</div>
                            <div class="practice-box p-practice" style="display:none; margin-top:10px;">
                                <input type="text" placeholder="Nhập lại câu..." style="width: 100%; padding: 8px;"
                                       onkeyup="checkPractice(this, '${item.en.replace(/'/g, "\\'")}', '${item.vi.replace(/'/g, "\\")}')">
                                <div class="feedback" style="font-size: 0.8rem; margin-top: 4px;"></div>
                            </div>
                            <div class="context-text p-context">${item.context || ''}</div> 
                            <div class="grammar-text p-grammar">📝 <b>Phân tích:</b><br>${item.grammar || ''}</div>
                        </div>
                    `).join('')}
                </div>

                <div class="section">
                    <h2>Câu Hỏi</h2>
                    ${lesson.questions.map(item => `
                        <div class="content-line">
                            <div class="btn-group" style="margin-bottom: 10px;">
                                <button onclick="toggleSingleContent(this, 'q-en')">Anh</button>
                                <button onclick="toggleSingleContent(this, 'q-ipa')">IPA</button>
                                <button onclick="toggleSingleContent(this, 'q-vi')">Việt</button>
                            </div>
                            <div style="margin-bottom: 10px; border-bottom: 1px dashed #ccc; padding-bottom: 5px;">
                                <div class="en-text q-en"><strong>${item.q}</strong></div>
                                <div class="ipa-text q-ipa"><em>${item.ipa || ''}</em></div>
                                <div class="vi-text q-vi"><strong>${item.vi}</strong></div>
                            </div>
                            <div class="options-group" style="padding-left: 15px;">
                                ${item.options ? item.options.map((opt, index) => `
                                    <div style="margin-bottom: 8px;">
                                        <span class="en-text q-en">${String.fromCharCode(65 + index)}. ${opt.en}</span>
                                        <span class="ipa-text q-ipa">(${opt.ipa || ''})</span>
                                        <span class="vi-text q-vi">: ${opt.vi}</span>
                                    </div>
                                `).join('') : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
 } else {
        // --- TAB 2: CHỈ FLASHCARDS ---
        const shuffledVocab = shuffleArray(lesson.vocabulary);

        mainContent = `
            <div class="section">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <h2 style="margin: 0;">Từ vựng Flashcards: ${lesson.title}</h2>
                    <button onclick="render()">🔀 Trộn lại</button>
                </div>
                <div class="flashcard-grid">
                    ${shuffledVocab.map(v => `
                        <div class="card" onclick="this.classList.toggle('flipped')">
                            <div class="card-inner">
<div class="card-front" style="display: flex; flex-direction: column; justify-content: center; padding: 15px; text-align: center;">
    <strong style="font-size: 1.25rem; margin-bottom: 12px; color: var(--brand-blue);">${v.vi}</strong>
    
    ${v.words[0].exVi ? `
        <div style="font-size: 0.9rem; color: #444; border-top: 1px solid #d1e3ff; padding-top: 10px; margin-top: 5px; font-weight: normal; line-height: 1.4;">
            <span style="color: var(--brand-blue); font-weight: bold; opacity: 0.7;">Ví dụ:</span> 
            ${v.words[0].exVi}
        </div>
    ` : ''}
</div>

                                <div class="card-back" style="padding: 10px; overflow-y: auto;">
                                    ${v.words.map(w => `
                                        <div class="vocab-item-row" style="display: flex; flex-direction: column; align-items: flex-start; border-bottom: 1px solid rgba(255,255,255,0.3); padding-bottom: 10px; margin-bottom: 10px; width: 100%;">
                                            
                                            <div style="display: flex; justify-content: space-between; width: 100%; align-items: center;">
                                                <div class="vocab-info" style="text-align: left;">
                                                    <div class="vocab-en" style="font-size: 1.1rem; font-weight: bold;">${w.en}</div>
                                                    <div class="vocab-ipa" style="opacity: 0.9; font-size: 0.85rem;">${w.ipa}</div>
                                                </div>
                                                <span class="speak-btn" style="cursor: pointer; font-size: 1.2rem;" onclick="event.stopPropagation(); speak('${w.en}')">🔊</span>
                                            </div>
                                            
                                            ${w.example ? `
                                                <div class="example-box" style="margin-top: 8px; font-size: 0.82rem; background: rgba(255,255,255,0.15); padding: 6px 10px; border-radius: 6px; border-left: 4px solid #fff; width: 92%; text-align: left;">
                                                    <div style="font-style: italic; color: #fff; line-height: 1.3;">
                                                        "${w.example}"
                                                    </div>
                                                </div>
                                            ` : ''}
                                            
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    const paginationHtml = `
        <div class="pagination-nav">
            <button onclick="goToLesson(${currentLessonIndex - 1})" ${currentLessonIndex === 0 ? 'disabled' : ''}>← Câu trước</button>
            <span style="font-weight: bold; align-self: center;">${currentLessonIndex + 1} / ${allLessons.length}</span>
            <button onclick="goToLesson(${currentLessonIndex + 1})" ${currentLessonIndex === allLessons.length - 1 ? 'disabled' : ''}>Câu sau →</button>
        </div>
    `;

    app.innerHTML = navHtml + tabHtml + mainContent + paginationHtml;
}

function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

function checkPractice(input, correctEn, correctVi) {
    const userValue = input.value.trim().toLowerCase();
    const feedback = input.nextElementSibling;
    const clean = (str) => str.toLowerCase().replace(/[.,?!]/g, "").trim();

    if (userValue === "") {
        feedback.innerHTML = "";
        input.style.borderColor = "#ccc";
        return;
    }

    if (clean(userValue) === clean(correctEn) || clean(userValue) === clean(correctVi)) {
        feedback.innerHTML = "Tuyệt vời!";
        feedback.className = "feedback correct";
        input.style.borderColor = "#28a745";
        input.style.backgroundColor = "#eafff0";
    } else {
        feedback.innerHTML = "Tiếp tục cố gắng...";
        feedback.className = "feedback";
        input.style.borderColor = "#ff4d4f";
        input.style.backgroundColor = "#fff1f0";
    }
}

render();