const baseUrl = '';

const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

const body = document.body;
const mainElement = document.querySelector('main');

const swapLanguagesButton = document.getElementById('exhange-languages-button');

const currentLanguageLabel = document.getElementById('current-language');
const targetLanguageLabel = document.getElementById('target-language');

const positiveScoreCounter = document.getElementById('positive-score');
const negativeScoreCounter = document.getElementById('negative-score');

const trainBox = document.querySelector('.train-box');
const trainBoxInput = document.querySelector('.train-box__input');
const trainBoxWord = document.querySelector('.train-box__word');
const trainBoxTimer = document.querySelector('.train-box__timer');
const trainBoxTranslations = document.querySelector('.train-box__translations');
const trainBoxTranslationsList = document.querySelector('.train-box__translations-list');

var event1_controller = new AbortController();
var event2_controller = new AbortController();
var event3_controller = new AbortController();
var event4_controller = new AbortController();
var event5_controller = new AbortController();

const languages = [
    { label: 'English', code: 'en' },
    { label: 'Русский', code: 'ru' },
];
var currentLanguage = languages[1];
var targetLanguage = languages[0];

const startTimerSeconds = 3;

var isTrainStarted = false;

var trainTimerCount = 0;
var stopTrainCounter = false;

var positiveScore = 0;
var negativeScore = 0;

var maxAlternativeTranslatesAmount = 5;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { signal: event1_controller.signal });
} else {
    init();
}

function init() {
    if (isMobile) body.classList.add('mobile');

    updateLanguages();
    
    setSwapLanguagesEvent();
    setStartTrainEvent();
}

function swapLanguages() {
    let tmp = currentLanguage;
    currentLanguage = targetLanguage;
    targetLanguage = tmp;

    updateLanguages();
}

function updateLanguages() {
    if (currentLanguage === targetLanguage) {
        for (let i = 0; i < languages.length; i++) {
            if (targetLanguage !== languages[i]) {
                targetLanguage = languages[i];
            }
        }
    }

    currentLanguageLabel.innerText = currentLanguage.label;
    targetLanguageLabel.innerText = targetLanguage.label;
}

function playStartTrainAnimation() {
    document.querySelector('.language-choice').classList.add('hide');
    document.querySelector('.instructions').classList.add('hide');
}

function hideMainMenu(shouldHide) {
    if (!shouldHide) {
        document.querySelector('.language-choice').classList.remove('hide');
        document.querySelector('.instructions').classList.remove('hide');

        return;
    }

    playStartTrainAnimation();
}

function handleStartTimer() {
    document.querySelector('.start-timer').classList.add('show');

    for (let i = startTimerSeconds; i >= 0; i--) {
        setTimeout(() => {
            document.querySelector('.start-timer__count').innerText = i;

            if (i === 0) {
                document.querySelector('.start-timer').classList.remove('show');

                isTrainStarted = true;

                handleTrainRound();
                handleTrainCounter();

                setFinishTrainEvent();
            }
        }, 1000 * (startTimerSeconds - i));
    }    
}

async function handleTrainRound() {
    if (!trainBox.classList.contains('active')) trainBox.classList.add('active');

    clearAnswerAnimationClass();

    hideTranslations();
    clearTrainBoxWord();
    clearTrainBoxInput();
    blockTrainBoxInput(true);

    await setRandomWord();

    blockTrainBoxInput(false);
    focusTrainBoxInput();

    setCheckAnswerEvent();
}

function handleTrainCounter() {
    updateTrainTimeCounter();

    const timeInterval = window.setInterval(() => {
        if (!isTrainStarted) {
            clearInterval(timeInterval);

            return;
        }

        if (stopTrainCounter) return;

        trainTimerCount++;

        updateTrainTimeCounter();
    }, 1000);
}

function getSeconds(count) {
    return count % 60;
}

function getMinutes(count) {
    return Math.floor(count / 60);
}

function displayTimePart(timePart) {
    return (Math.abs(timePart) < 10) ? '0' + timePart : timePart;
}

function displayTimeCounter(count) {
    let counterDivider = ':';

    return displayTimePart(getMinutes(count)) + counterDivider + displayTimePart(getSeconds(count));
}

function updateTrainTimeCounter() {
    trainBoxTimer.innerText = displayTimeCounter(trainTimerCount);
}

async function getRandomWord() {
    var controller = new AbortController();

    setElementLoadingState(trainBox, true);
    stopTrainTimeCounter(true);

    try {
        const response = await fetch(baseUrl + '/word/' + targetLanguage.code, {
            signal: controller.signal,
        });

        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }

        const result = await response.json();

        return result.word;
    } catch (err) {
        if (err.name === 'AbortError') {
            console.log('Fetch aborted.');
        } else {
            throw err;
        }
    } finally {
        setElementLoadingState(trainBox, false);
        stopTrainTimeCounter(false);
    }
}

async function setRandomWord() {
    const word = await getRandomWord();

    trainBoxWord.value = word;
}

function setElementLoadingState(element, isLoading) {
    if (!isLoading) {
        element.classList.remove('loading');

        return;
    }

    element.classList.add('loading');
}

function stopTrainTimeCounter(shouldStop) {
    stopTrainCounter = shouldStop;
}

function setStartTrainEvent() {
    if (isTrainStarted) return;

    document.addEventListener('keydown', function eventHandler(e) {
        if (e.code !== 'Enter') return;
        document.removeEventListener('keydown', eventHandler);
        
        hideMainMenu(true);
        updateScoreCounters();

        setTimeout(handleStartTimer, 1000);
    }, { signal: event2_controller.signal });
}

function setCheckAnswerEvent() {
    if (!isTrainStarted) return;

    document.addEventListener('keydown', async function eventHandler(e) {
        if (e.code !== 'Enter') return;
        
        if (trainBoxInput.value === '') {
            playEmptyInputAnimation();
            return;
        }

        document.removeEventListener('keydown', eventHandler);

        handleTrainAnswer(await isCorrectAnswer());
    }, { signal: event3_controller.signal });
}

function setNextWordEvent() {
    if (!isTrainStarted) return;

    document.addEventListener('keydown', async function eventHandler(e) {
        if (e.code !== 'Enter') return;
        document.removeEventListener('keydown', eventHandler);

        handleTrainRound();
    }, { signal: event4_controller.signal });
}

async function isCorrectAnswer() {
    var controller = new AbortController();

    try {
        const response = await fetch(baseUrl + '/train/check', {
            method: 'POST',
            body: JSON.stringify({
                currentWord: { word: trainBoxInput.value, languageCode: currentLanguage.code }, 
                targetWord: { word: trainBoxWord.value, languageCode: targetLanguage.code }, 
            }),
            headers: {
                'Content-Type': 'application/json',
            },
            signal: controller.signal,
        });

        if (!response.ok) {
            throw new Error('Response status: ' + response.status);
        }

        const result = await response.json();

        return result.isCorrect;
    } catch (err) {
        if (err.name === 'AbortError') {
            console.log('Fetch aborted.');
        } else {
            throw err;
        }
    }
}

function handleTrainAnswer(isCorrect) {
    if (isCorrect) {
        positiveScore++;
    } else {
        negativeScore++;
    }
    
    updateScoreCounter(isCorrect);
    playAnswerAnimation(isCorrect);

    stopTrainTimeCounter(true);

    showTranslations();

    setNextWordEvent();
}   

function updateScoreCounter(isCorrect) {
    if (isCorrect) {
        positiveScoreCounter.innerText = positiveScore;

        return;
    }
    
    negativeScoreCounter.innerText = negativeScore;
}

function updateScoreCounters() {
    updateScoreCounter(true);
    updateScoreCounter(false);
}

function playAnswerAnimation(isCorrect) {
    clearAnswerAnimationClass();

    if (isCorrect) {
        mainElement.classList.add('correct-answer');

        return;
    }

    mainElement.classList.add('wrong-answer');
}

function clearAnswerAnimationClass() {
    mainElement.classList.remove('correct-answer');
    mainElement.classList.remove('wrong-answer');
}

function blockTrainBoxInput(shouldBlock) {
    if (shouldBlock) {
        trainBoxInput.setAttribute('readonly', '');

        return;
    }

    trainBoxInput.removeAttribute('readonly');
}

function clearTrainBoxInput() {
    trainBoxInput.value = '';
}

function clearTrainBoxWord() {
    trainBoxWord.value = '';
}

function focusTrainBoxInput() {
    trainBoxInput.focus();
}

async function getTranslations() {
    var controller = new AbortController();

    setElementLoadingState(trainBoxTranslations, true);

    try {
        const response = await fetch(baseUrl + '/train/translations', {
            method: 'POST',
            body: JSON.stringify({
                currentLanguageCode: { languageCode: currentLanguage.code }, 
                targetWord: { word: trainBoxWord.value, languageCode: targetLanguage.code }, 
            }),
            headers: {
                'Content-Type': 'application/json',
            },
            signal: controller.signal,
        });

        if (!response.ok) {
            throw new Error('Response status: ' + response.status);
        }

        const result = await response.json();

        return result;
    } catch (err) {
        if (err.name === 'AbortError') {
            console.log('Fetch aborted.');
        } else {
            throw err;
        }
    } finally {
        setElementLoadingState(trainBoxTranslations, false);
    }
}

async function showTranslations() {
    trainBoxTranslations.classList.add('active');

    const wordTranslations = await getTranslations();

    const mainTranslation = document.createElement('li');
    mainTranslation.innerText = wordTranslations.translations.translatedText;

    mainTranslation.classList.add('train-box__translations-item');
    mainTranslation.classList.add('train-box__translations-item--main');
    trainBoxTranslationsList.appendChild(mainTranslation);

    const alternativesAmount = wordTranslations.translations.alternatives.length;

    const elementsAmount = (alternativesAmount > maxAlternativeTranslatesAmount) ? maxAlternativeTranslatesAmount : alternativesAmount;

    for (let i = 0; i < elementsAmount; i++) {
        const alternativeTranslation = document.createElement('li');
        alternativeTranslation.innerText = wordTranslations.translations.alternatives[i];
        alternativeTranslation.classList.add('train-box__translations-item');
        alternativeTranslation.classList.add('train-box__translations-item--alternative');
        trainBoxTranslationsList.appendChild(alternativeTranslation);
    }
}

function hideTranslations() {
    trainBoxTranslations.classList.remove('active');
    trainBoxTranslationsList.innerHTML = '';
}

function playEmptyInputAnimation() {
    if (trainBox.classList.contains('empty-input')) trainBox.classList.remove('empty-input');

    trainBox.classList.add('empty-input');

    setTimeout(() => {
        trainBox.classList.remove('empty-input');
    }, 400);
}

function setFinishTrainEvent() {
    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;

        handleFinishTrain();
    });
}

function setSwapLanguagesEvent() {
    swapLanguagesButton.addEventListener('click', function eventHandler() {
        swapLanguages();
    }, { signal: event5_controller.signal });
}

function handleFinishTrain() {
    trainTimerCount = 0;
    stopTrainCounter = true;

    positiveScore = 0;
    negativeScore = 0;

    clearAnswerAnimationClass();

    hideTranslations();
    clearTrainBoxWord();
    clearTrainBoxInput();
    blockTrainBoxInput(true);

    updateScoreCounters();
    updateTrainTimeCounter();

    trainBox.classList.remove('active');
    hideMainMenu(false);
    
    isTrainStarted = false;

    abortEvetControllers();
    
    setSwapLanguagesEvent();
    setStartTrainEvent();
}

function abortEvetControllers() {
    event1_controller.abort();
    event2_controller.abort();
    event3_controller.abort();
    event4_controller.abort();
    event5_controller.abort();

    resetEventControllers();
}

function resetEventControllers() {
    event1_controller = new AbortController();
    event2_controller = new AbortController();
    event3_controller = new AbortController();
    event4_controller = new AbortController();
    event5_controller = new AbortController();
}